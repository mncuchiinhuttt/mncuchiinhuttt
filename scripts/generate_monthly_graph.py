import json
import os
import urllib.request
from datetime import datetime, timezone

USERNAME = "mncuchiinhuttt"
YEAR = datetime.now(timezone.utc).year

query = """
query ($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
"""

variables = {
    "login": USERNAME,
    "from": f"{YEAR}-01-01T00:00:00Z",
    "to": f"{YEAR}-12-31T23:59:59Z",
}

token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
headers = {"Content-Type": "application/json"}
if token:
    headers["Authorization"] = f"Bearer {token}"

req = urllib.request.Request(
    "https://api.github.com/graphql",
    data=json.dumps({"query": query, "variables": variables}).encode("utf-8"),
    headers=headers,
)

with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode("utf-8"))

weeks = res["data"]["user"]["contributionsCollection"]["contributionCalendar"]["weeks"]
monthly = {i: 0 for i in range(1, 13)}
for w in weeks:
    for day in w["contributionDays"]:
        m = int(day["date"].split("-")[1])
        monthly[m] += day["contributionCount"]

counts = [monthly[i] for i in range(1, 13)]
months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

# Monotone cubic interpolation (Fritsch-Carlson)
def monotone_cubic_svg(points):
    n = len(points)
    x = [p[0] for p in points]
    y = [p[1] for p in points]
    d = [(y[i+1] - y[i]) / (x[i+1] - x[i]) for i in range(n - 1)]
    m = [0.0] * n
    m[0] = d[0]
    m[n-1] = d[n-2]
    for i in range(1, n - 1):
        if d[i-1] * d[i] <= 0:
            m[i] = 0.0
        else:
            m[i] = (d[i-1] + d[i]) / 2.0
    for i in range(n - 1):
        if d[i] == 0:
            m[i] = 0.0
            m[i+1] = 0.0
        else:
            alpha = m[i] / d[i]
            beta = m[i+1] / d[i]
            if alpha < 0:
                m[i] = 0.0
            if beta < 0:
                m[i+1] = 0.0
            if alpha**2 + beta**2 > 9:
                tau = 3.0 / ((alpha**2 + beta**2) ** 0.5)
                m[i] = tau * alpha * d[i]
                m[i+1] = tau * beta * d[i]

    path = f"M {x[0]:.2f},{y[0]:.2f}"
    for i in range(n - 1):
        dx = (x[i+1] - x[i]) / 3.0
        p1x = x[i] + dx
        p1y = y[i] + m[i] * dx
        p2x = x[i+1] - dx
        p2y = y[i+1] - m[i+1] * dx
        path += f" C {p1x:.2f},{p1y:.2f} {p2x:.2f},{p2y:.2f} {x[i+1]:.2f},{y[i+1]:.2f}"
    return path

width, height = 850, 340
padding_left, padding_right = 65, 45
padding_top, padding_bottom = 65, 50
plot_w = width - padding_left - padding_right
plot_h = height - padding_top - padding_bottom

max_c = max(counts) if max(counts) > 0 else 100
max_val = int(((max_c + 350) // 350) * 350)
y_ticks = [0, max_val // 4, max_val // 2, (max_val * 3) // 4, max_val]

points = []
for i, count in enumerate(counts):
    px = padding_left + (i / 11.0) * plot_w
    py = padding_top + plot_h - (count / max_val) * plot_h
    points.append((px, py))

path_d = monotone_cubic_svg(points)
area_d = path_d + f" L {points[-1][0]:.2f},{padding_top + plot_h:.2f} L {points[0][0]:.2f},{padding_top + plot_h:.2f} Z"

svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="{height}">
  <defs>
    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f78fb3" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#fff0f6" stop-opacity="0.02" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#ee6f9b" flood-opacity="0.25" />
    </filter>
  </defs>

  <rect width="{width}" height="{height}" rx="12" fill="#fff0f6" />

  <text x="{width/2}" y="38" text-anchor="middle" fill="#8b6b75" font-family="'Segoe UI', Ubuntu, -apple-system, sans-serif" font-size="18" font-weight="700">Vo Minh Long's {YEAR} Monthly Contributions</text>

  <text x="{- (padding_top + plot_h/2)}" y="20" transform="rotate(-90)" text-anchor="middle" fill="#8b6b75" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" font-weight="600">Contributions</text>

  <text x="{padding_left + plot_w/2}" y="{height - 14}" text-anchor="middle" fill="#8b6b75" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" font-weight="600">Months ({YEAR})</text>
"""

for val in y_ticks:
    y = padding_top + plot_h - (val / max_val) * plot_h
    svg += f"""  <line x1="{padding_left}" y1="{y:.2f}" x2="{padding_left + plot_w}" y2="{y:.2f}" stroke="#fbcfe8" stroke-width="1" stroke-dasharray="3,3" />\n"""
    svg += f"""  <text x="{padding_left - 12}" y="{y + 4:.2f}" text-anchor="end" fill="#8b6b75" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" font-weight="600">{val:,}</text>\n"""

for i, m_name in enumerate(months):
    x = padding_left + (i / 11.0) * plot_w
    svg += f"""  <line x1="{x:.2f}" y1="{padding_top}" x2="{x:.2f}" y2="{padding_top + plot_h}" stroke="#fbcfe8" stroke-width="1" stroke-dasharray="3,3" />\n"""
    svg += f"""  <text x="{x:.2f}" y="{padding_top + plot_h + 20}" text-anchor="middle" fill="#8b6b75" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="12" font-weight="600">{m_name}</text>\n"""

svg += f"""  <path d="{area_d}" fill="url(#areaGradient)" />
  <path d="{path_d}" fill="none" stroke="#f78fb3" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)" />
"""

for i, (x, y) in enumerate(points):
    c = counts[i]
    svg += f"""  <g class="point-group">
    <circle cx="{x:.2f}" cy="{y:.2f}" r="5.5" fill="#ff9fbc" stroke="#fff0f6" stroke-width="2" />
"""
    if c > 0:
        svg += f"""    <text x="{x:.2f}" y="{y - 10:.2f}" text-anchor="middle" fill="#ee6f9b" font-family="'Segoe UI', Ubuntu, sans-serif" font-size="11" font-weight="700">{c:,}</text>\n"""
    svg += "  </g>\n"

svg += "</svg>"

output_path = os.path.join(os.path.dirname(__file__), "..", "images", f"github-monthly-contributions-{YEAR}.svg")
with open(output_path, "w", encoding="utf-8") as f:
    f.write(svg)
print("Updated monthly graph SVG successfully at:", output_path)
