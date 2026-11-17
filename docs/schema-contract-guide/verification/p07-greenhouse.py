#!/usr/bin/env python3
"""P07 스마트 온실: 저장 규모와 경보 판정(5회 연속 35.0℃ 초과, 3분 무응답)을 계산합니다."""
import json
sensors = 3 * 12
per_day = sensors * 24 * 60
raw_90 = per_day * 90
avg_per_day = sensors * 24 * 60 // 5
avg_730 = avg_per_day * 730
assumed_row_bytes = 60  # 가정한 값
# T-03 의 10:00 부터 1분 간격 측정값 (None = 수신 없음)
temps = [34.8, 35.2, 35.6, 36.0, 34.9, 35.3, 35.4, 35.8, 36.1, 36.4, 36.2, None, None, None, None, 35.9]
alarms, run = [], 0
for i, v in enumerate(temps):
    t = f"10:{i:02d}"
    if v is None:
        run = 0
        continue
    run = run + 1 if v > 35.0 else 0
    if run == 5:
        alarms.append({"경보": "고온", "시각": t, "연속 시작": f"10:{i-4:02d}"})
# 무응답: 마지막 수신 뒤 3분이 지나도록 새 값이 없으면
last = None
for i, v in enumerate(temps):
    if v is not None:
        last = i
    elif last is not None and i - last == 3:
        alarms.append({"경보": "센서 끊김", "시각": f"10:{i:02d}", "마지막 수신": f"10:{last:02d}"})
print(json.dumps({"센서 수": sensors, "하루 원시 행": per_day, "90일 원시 행": raw_90,
                  "90일 원시 바이트(행 60바이트 가정)": raw_90 * assumed_row_bytes,
                  "하루 5분 평균 행": avg_per_day, "730일 5분 평균 행": avg_730, "경보": alarms},
                 ensure_ascii=False, indent=1))
