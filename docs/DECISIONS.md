# ExamPrep web decision log

The handoff's section 18 remains the authoritative open-decision list. Decisions below are implementation defaults only and must be confirmed before the corresponding feature ships.

| Area | Current implementation default | Status |
| --- | --- | --- |
| Exam duration | Use backend `test.timing` | Pending product confirmation |
| Passing score | Use backend `test.passing` | Pending product confirmation |
| Browser device identity | Random opaque UUID; no invasive fingerprinting | Pending backend proof |
| Offline media | Not yet implemented | Scope decision required |
| iApplication navigation | Visible four-destination hub | Pending product confirmation |
| Registration completion | Return to login after complete or skip | Pending product confirmation |
| Native IAP | Use backend-authored web renewal/checkout CTAs | Pending commerce confirmation |
| Dashboard freshness | Focus/revalidate with a 60-second stale interval | Accepted handoff default |
