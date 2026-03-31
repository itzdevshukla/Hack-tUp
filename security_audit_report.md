# 🕵️‍♂️ Advanced Security Audit Report: Hack!tUp Platform

As requested, I have analyzed the provided Django application (`ctf`, `accounts`, `challenges`, `administration`, etc.) from the perspective of an advanced threat actor. Below is a comprehensive, prioritized breakdown of the critical vulnerabilities, business logic bypasses, and misconfigurations discovered.

---

## 🔥 Top 5 Critical Vulnerabilities

### 1. 🛑 TOTP Session Privilege Escalation (Auth Bypass)
* **📍 Location:** `accounts/api_views.py` (`login_api`) and `dashboard/api_views.py` (`user_request_event_api`)
* **🧠 Root Cause:** The TOTP verification logic is **only enforced at login**. When a user connects and successfully passes as a "normal user", their session does not contain the `totp_verified` requirement. However, if a normal user's event request gets approved *while they are still logged in*, their account is granted the `EventRole` of `organizer`. Their active session inherently gains full administrative access immediately, completely circumventing the strict 2FA requirement.
* **💥 Exploitation Scenario:**
  1. Attacker registers an account and logs in (no 2FA required).
  2. Attacker creates an event through the dashboard.
  3. A global admin reviews and approves the event.
  4. The platform automatically assigns the attacker the `organizer` role.
  5. Instead of logging out, the attacker actively leverages their existing session token to navigate `is_admin` endpoints. They now have complete administrative control over their event without ever activating or passing an authenticator challenge.
* **🛠️ Fix:** Introduce a custom permission or middleware check. Any endpoint guarded by `is_admin` must enforce that `request.session.get('totp_verified') == True` if the user's role was elevated mid-session.
* **🧪 Severity:** **CRITICAL**

### 2. 🎲 Cryptographic Flaw: Predictable OTP Generation
* **📍 Location:** `ctf/utils.py` (`generate_otp` function)
* **🧠 Root Cause:** The codebase relies on Python's built-in `random.choices(string.ascii_uppercase + string.digits, k=6)` to generate OTPs. The default `random` module implements the Mersenne Twister algorithm, which is entirely predictable and not cryptographically secure.
* **💥 Exploitation Scenario:**
  1. An attacker sets up an automation script to trigger the `forgot_password_send_otp_api` / `send_registration_otp_api` for their own controlled accounts repeatedly.
  2. They collect ~624 continuous outputs and use an MT19937 recovery tool (like `randcrack`) to duplicate the RNG's internal state.
  3. Once synced, they trigger the password reset flow for the sysadmin (`admin@hackitupnow.tech`).
  4. Since the state is synced algorithmically, the attacker knows exactly which 6-digit OTP the server generated and bypasses the email box entirely, resetting the admin password.
* **🛠️ Fix:** Replace the `random` module with the cryptographically secure `secrets` library:
  ```python
  import secrets
  import string
  
  def generate_otp(length=6):
      return "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
  ```
* **🧪 Severity:** **HIGH**

### 3. 🏁 Hint Unlock Race Condition (Negative Balance Logic Flaw)
* **📍 Location:** `challenges/api_views.py` (`unlock_hint_api`)
* **🧠 Root Cause:** Time-of-Check to Time-of-Use (TOCTOU). When deducting points for hints, the backend fetches `user_solves` and `user_hints` independently, subtracts them locally in Python (`current_points = max(0, user_solves - user_hints)`), and then inserts a `UserHint` record if affordable. There are no row-level database locks preventing duplicate concurrent reads.
* **💥 Exploitation Scenario:**
  1. A user obtains exactly `100` points.
  2. The user sees 5 lucrative hints belonging to different challenges, each costing `50` points (Total `250`).
  3. Using Burp Suite's Turbo Intruder, the user submits all 5 HTTP requests simultaneously.
  4. All 5 threads read `current_points = 100`. All 5 pass the `current_points >= hint.cost` evaluation check.
  5. The database inserts 5 new `UserHint` rows. The attacker unlocked 250 points worth of hints with only 100 points, effectively granting free hints due to the `max(0, negative_balance)` math in consecutive evaluations.
* **🛠️ Fix:** Wrap hint unlocks in `transaction.atomic()`, and use a `select_for_update()` queue or shift the reduction math directly down to the SQL sequence using Django's `F()` expressions.
* **🧪 Severity:** **HIGH**

### 4. 🥷 Logic Bypass: Submitting Flags for Inactive Challenges
* **📍 Location:** `challenges/api_views.py` (`submit_flag_api`)
* **🧠 Root Cause:** The `submit_flag_api` checks if the event is live and the user is registered. However, it completely fails to evaluate if the **Challenge Wave** restricts the target challenge (`challenge.wave.is_active`).
* **💥 Exploitation Scenario:**
  1. The attacker sequentially guesses or enumerates the numeric `challenge_id` values (e.g., `/api/challenges/14/submit/`).
  2. The attacker finds an ID that belongs to an "Upcoming" locked wave.
  3. The attacker brute-forces, leaks, or guesses the flag content and submits it successfully to the backend endpoints.
  4. The platform credits the attacker with the first-blood and points for a challenge nobody else can access yet.
* **🛠️ Fix:** Validate the active state of a challenge prior to evaluation. Add a wave check in the view query:
  ```python
  if challenge.wave and not challenge.wave.is_active:
      return JsonResponse({'error': 'Challenge locked'}, status=403)
  ```
* **🧪 Severity:** **HIGH**

### 5. 🚪 Team Capacity Override (TOCTOU Concurrency Issue)
* **📍 Location:** `dashboard/api_views.py` (`join_event_api`) & `teams/api_views.py` (`handle_join_request_api`)
* **🧠 Root Cause:** The system checks maximum participants in Python logic `< event.max_team_size` and `< event.max_participants`, then saves the record without locking. During high-demand "drop" events, strict bounds disappear under concurrent HTTP load.
* **💥 Exploitation Scenario:** Ten distinct users script up a simultaneous HTTP POST payload entering the event's exact `accessCode`. All backend threads evaluate that `< 100` participants exist. The final headcount rises to 110/100, violating event logistics limits.
* **🛠️ Fix:** Like the Hint vulnerability, leverage `transaction.atomic()` with `select_for_update()` on the event record, or enforce constraints dynamically inside SQL.
* **🧪 Severity:** **MEDIUM**

---

## 🪲 Additional Discoveries & Flaws

1. **Password Complexity Bypass**
   * **Location:** `accounts/api_views.py` (`change_password_api`)
   * **Root Cause & Fix:** During `register_api` and `forgot_password_reset_api`, regex guarantees the usage of 8-16 character alphanumeric setups with special symbols. The `change_password_api` natively ignores it. An attacker taking over a session could overwrite the password to `"A"` permanently rendering the user weak to offline brute forcing or credential stuffing. Abstract your password regex validations into a shared utility function and enforce it globally.

2. **Insecure References (IDOR)**
   * **Location:** `challenges/api_views.py` (`challenge_solvers_api`)
   * **Root Cause & Fix:** No validation on `challenge.wave.is_active`. Competitors can hit `/api/challenges/[unreleased_id]/solvers` entirely unnoticed and enumerate future developments before admins are ready. Add an active wave check.

3. **Predictable Sensitive Data Exposure in S3 AWS Artifacts**
   * **Location:** `settings.py` -> `AWS_QUERYSTRING_AUTH = False` and `upload_to="challenge_attachments/"`.
   * **Root Cause & Fix:** The platform doesn't use pre-signed URLs or randomized UUID prefixes for challenge attachments. An attacker can brute-force the predictable path `https://[bucket].s3.amazonaws.com/challenge_attachments/[guessable_name].zip` and steal unreleased attachments. Fix this by setting `AWS_QUERYSTRING_AUTH` to `True` or hashing filenames on upload via a custom upload path.

---

## 🔗 The "Matrix Sequence" Attack Chain (Demo)
*A realistic escalation narrative to present inside a Bug Bounty report:*

1. **The Foothold**: I map the API limits and realize `random.choices` dictates OTP authentication via standard Python seeds. I leverage `randcrack`, submit ~600 trivial registration requests, and acquire the OTP randomness state model for the platform.
2. **The Hijack**: I target a user with an established team account. I trigger a password reset, extract the predictable seed exactly from my local model, and bypass the email payload, entering the active team dashboard.
3. **The Score Multiplier (Race Condition)**: Finding a mid-level solvable challenge, I exploit the lack of database locks inside the backend. I simultaneously submit 5 distinct `hint unlocks` utilizing the hijacked account's point balance. The checks overlap, reducing my budget artificially but granting the hints permanently.
4. **The Ghost Solve**: Observing sequential patterns, I map predictable challenge IDs that haven't launched yet on the platform due to locked Waves. Utilizing the illegally obtained hints against the IDOR vulnerability `/api/challenges/[upcoming_id]/solvers`, I deduce the unreleased layout. Finally, I circumvent business logic by submitting flags against future challenges `/api/challenges/99/`, securing an insurmountable, completely undocumented leaderboard victory.

---

## 📊 Vitals & Closing Verdict

**Overall Security Score: 4.5/10**

The platform executes excellent operational setups (such as enforcing `ContentDisposition: attachment` for AWS uploads avoiding XSS, properly separating WSGI and ASGI routers, handling SQS cleanly, and executing robust initial 2FA flows). 

However, **Concurrency Flaws (Race Conditions)** and **Core Logic Breakdowns (TOCTOU on TOTP and hints, generic RNG handling)** drastically diminish the application's integrity boundaries. The backend acts as a highly capable engine but essentially leaves the windows open during massive transaction intersections, resulting in simple, devastating circumventions from sophisticated exploitation vectors.
