import os

file_path = r"c:\Users\Dev Shukla\Desktop\Hackitup\administration\api_views.py"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
imported = False

for i, line in enumerate(lines):
    stripped = line.strip()
    
    # Add import
    if "from ctf.utils import encode_id" in line and not imported:
        new_lines.append(line)
        new_lines.append("from challenges.signals import emit_ws_event\n")
        imported = True
        continue
        
    if "emit_ws_event" in line:
        imported = True # In case it was already patched
        
    indent = line[:len(line) - len(line.lstrip())]
    
    # Replacements
    if stripped == 'return JsonResponse({"message": "Challenge created successfully", "id": encode_id(challenge.id)}, status=201)':
        new_lines.append(f'{indent}emit_ws_event("challenge_updated", {{"event_id": encode_id(event.id)}})\n')
        new_lines.append(line)
    elif stripped == 'return JsonResponse({"message": "Challenge updated successfully"})':
        new_lines.append(f'{indent}emit_ws_event("challenge_updated", {{"event_id": encode_id(event_id)}})\n')
        new_lines.append(line)
    elif stripped == 'return JsonResponse({"message": "Challenge deleted successfully"})':
        new_lines.append(f'{indent}emit_ws_event("challenge_updated", {{"event_id": encode_id(event_id)}})\n')
        new_lines.append(line)
    
    elif stripped == 'return JsonResponse({"id": encode_id(wave.id), "name": wave.name, "order": wave.order, "is_active": wave.is_active, "challenge_count": 0}, status=201)':
        new_lines.append(f'{indent}emit_ws_event("waves_updated", {{"event_id": encode_id(event.id)}})\n')
        new_lines.append(line)
    elif stripped == 'return JsonResponse({"id": encode_id(wave.id), "name": wave.name, "is_active": wave.is_active, "order": wave.order})':
        new_lines.append(f'{indent}emit_ws_event("waves_updated", {{"event_id": encode_id(event_id)}})\n')
        new_lines.append(line)
    elif stripped == 'return JsonResponse({"message": "Wave deleted successfully"})':
        new_lines.append(f'{indent}emit_ws_event("waves_updated", {{"event_id": encode_id(event_id)}})\n')
        new_lines.append(line)
    elif stripped == 'return JsonResponse({"message": "Challenges assigned successfully", "count": len(challenge_ids)})':
        new_lines.append(f'{indent}emit_ws_event("challenge_updated", {{"event_id": encode_id(event_id)}})\n')
        new_lines.append(line)
    else:
        new_lines.append(line)

with open(file_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Backend APIs patched successfully")
