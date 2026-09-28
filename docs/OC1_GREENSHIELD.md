# OC1: Sản phẩm GreenShield (EXE201 FA26)

Tài liệu làm việc đối chiếu các đầu việc 1.1–1.10 trong hướng dẫn môn học. **Có trong mã nguồn** khác với **đã có minh chứng nộp bài**. Không dùng dữ liệu demo hoặc phản hồi giả lập như dữ liệu khách hàng thật.

## 1.1. Ý tưởng EXE101 và sản phẩm hiện tại

**Vấn đề:** Nhóm xây chatbot, RAG và AI agent khó kiểm tra trước khi phát hành các rủi ro prompt injection, rò rỉ nội dung truy xuất, tool call không an toàn và lộ API key. Một danh sách lỗi chung chung không giúp tái hiện, ưu tiên và sửa.

**Giải pháp:** GreenShield cho phép tạo project, khai báo target HTTP, kiểm tra kết nối, chọn bài thử, chạy scan, đọc finding kèm input/response/bằng chứng, xem hướng sửa và retest. Report tập trung vào Risk Score, Risk Level, Findings và Retest Status.

**Khách hàng mục tiêu (giả thuyết):** Developer/AI engineer xây chatbot nội bộ hoặc RAG; security engineer và product owner cần bằng chứng trước khi triển khai. Người dùng và người trả tiền có thể khác nhau. Chưa có phỏng vấn thật để xác nhận phân khúc mua đầu tiên.

**Mô hình doanh thu (giả thuyết):** Gói theo lượt scan/tháng hoặc assessment theo dự án. Repo hiện **chưa có thanh toán thật**; trang giá không phải minh chứng giao dịch. Engine dùng test theo quy tắc và demo target có kiểm soát, không phải red team toàn diện. Xem [README](../README.md), [phạm vi MVP](MVP_SCOPE.md), [kiến trúc](ARCHITECTURE.md).

## 1.2. Phỏng vấn lại 5–10 khách hàng

**Chưa có minh chứng phỏng vấn thật trong repo.** Mỗi buổi cần ghi ngày, vai trò, vấn đề thực tế, cách giải quyết hiện tại, ý kiến về evidence/retest, khả năng dùng hoặc trả tiền và lo ngại bảo mật. Chỉ lưu ghi âm khi được đồng ý; che thông tin nhận dạng, email và secret khi nộp.

| Mã | Vai trò | Ngày | Phát hiện | Minh chứng |
| --- | --- | --- | --- | --- |
| PV01–PV10 | Chưa thu thập | Chưa có | Chưa xác minh | Chưa có |

Không điền câu trả lời do AI tự bịa vào bảng này.

## 1.3. Bảng điều chỉnh EXE101 → EXE201

Chưa tìm thấy bản EXE101 gốc trong repo. Cột “trước” và lý do phải đối chiếu slide/báo cáo EXE101 cùng kết quả phỏng vấn thật.

| Chủ đề | EXE101 gốc | GreenShield hiện tại | Căn cứ cần bổ sung |
| --- | --- | --- | --- |
| Khách hàng | Chưa có tài liệu gốc | Nhóm phát triển AI app/RAG/agent | Slide EXE101 + phỏng vấn |
| Giá trị chính | Chưa có tài liệu gốc | Scan → evidence → fix → retest | Slide EXE101 + phản hồi |
| Phạm vi | Chưa có tài liệu gốc | Target HTTP, bốn test theo quy tắc | Kế hoạch cũ + phản hồi |
| Doanh thu | Chưa có tài liệu gốc | Báo giá dự kiến, chưa thanh toán thật | Giả định cũ + nhu cầu thật |

Mẫu lập luận: “EXE101 giả định X → phỏng vấn/số liệu cho thấy Y → EXE201 điều chỉnh thành Z”. Không có Y thì ghi “giả thuyết”.

## 1.4. Phạm vi MoSCoW

| Mức | Tính năng | Hiện trạng |
| --- | --- | --- |
| Must | Đăng ký/đăng nhập, phân tách workspace | Có trong repo; cần thử bản deploy |
| Must | Tạo project/target, test connection | Có trong repo |
| Must | Chọn bài thử, scan, lưu finding | Có trong repo |
| Must | Report có evidence, masking, hướng sửa, retest | Có trong repo; cần kiểm tra UI thật |
| Must | Liên hệ, chính sách quyền riêng tư | Liên hệ có; privacy cần bổ sung/xác minh |
| Must | GA4 hoặc Firebase Analytics với số liệu thật | Chưa có minh chứng |
| Should | PDF chuẩn, giải thích Risk Score | PDF qua trình in; scoring có trong code |
| Could | Mời thành viên, scan theo lịch, email | Chưa có |
| Won't | Thanh toán thật, LLM judge, compliance dashboard | Không làm trong demo |

## 1.5. Thiết kế màn hình

Luồng chính: `Đăng ký/Đăng nhập → Dashboard → Tạo project → Cấu hình target → Test connection → Chọn test → Scan → Report → Retest`. UI ở `src/pages` và `src/components`; [checklist thiết kế](design/review-checklist.md). Để nộp 1.5, cần thêm link Figma hoặc ảnh bản phác có ngày. Mã nguồn UI không tự thay thế minh chứng thiết kế.

## 1.6. Tiến độ và người phụ trách

Đây là kế hoạch mẫu, **không phải xác nhận tiến độ thực tế**. Nhóm cần điền tên và cập nhật tình trạng theo tuần.

| Tuần | Mốc | Đầu ra | Phụ trách | Thực tế |
| --- | --- | --- | --- | --- |
| 1 | Ý tưởng, lịch phỏng vấn | 1.1–1.2 | Chưa phân công | Chưa xác minh |
| 2 | Phỏng vấn, so EXE101, MoSCoW, phác UI | 1.2–1.5 | Chưa phân công | Chưa xác minh |
| 3 | Chốt scope, trình bày kế hoạch | 1.6–1.7 | Chưa phân công | Chưa xác minh |
| 4 | Kiểm thử lõi, đo lường | 1.7–1.8 | Chưa phân công | Chưa xác minh |
| 5 | Kiểm thử bản deploy, sửa lỗi | Test log, video | Chưa phân công | Chưa xác minh |
| 6 | Domain, privacy, hồ sơ phát hành | 1.9 | Chưa phân công | Chưa xác minh |
| 7 | Demo công khai, đối chiếu kế hoạch–thực tế | 1.10 | Chưa phân công | Chưa xác minh |

## 1.7. Luồng lõi và kiểm thử

Repo có React/Vite, Express, SQLite, test tự động và script quay demo. [Schema](../server/db/migrations/001_initial.sql) có users, workspaces, projects, targets, scans, executions, findings, evidence, retests, reports và audit events. [Test luồng](../test/product-flow.test.js) và [test scoring](../test/scoring.test.js) là một phần minh chứng kỹ thuật, chưa thay thế video và log bản triển khai.

| ID | Tình huống | Kết quả cần đạt | Minh chứng cần lưu |
| --- | --- | --- | --- |
| T01 | Đăng ký, đăng nhập, đăng xuất | Session đúng tài khoản, không đọc dữ liệu workspace khác | Video + log API |
| T02 | Tạo project/target | Dữ liệu còn sau refresh | Ảnh UI + DB đã che dữ liệu |
| T03 | Test connection | Kết quả thành công hoặc lỗi rõ ràng | Ảnh UI |
| T04 | Chọn test, chạy scan | Tiến độ kết thúc, report được tạo | Video + scan record |
| T05 | Mở finding | Evidence đã mask, impact, fix hiển thị đầy đủ | Ảnh report |
| T06 | Chuyển demo target sang fixed, retest | Trạng thái đổi và lưu lịch sử | Video + DB record |
| T07 | Target lỗi/timeout | Không treo vô hạn, không lộ secret | Log đã che dữ liệu |
| T08 | Refresh deep link trên domain công khai | Không 404 | URL + ảnh |

Nhật ký AI cần ghi prompt/yêu cầu chính, ngày, người yêu cầu, file thay đổi và cách kiểm chứng. Lịch sử Git chứng minh thay đổi mã nguồn, **không tự thay thế** nhật ký câu lệnh AI theo rubric.

## 1.8. Đo lường

**Chưa xác nhận GA4/Firebase hoạt động hoặc có dữ liệu thật.** Cần cấu hình tài khoản của nhóm, gắn event, kiểm tra DebugView/Realtime trên bản công khai và chụp ảnh có ngày, nguồn, khoảng thời gian. Không gửi prompt, response, token, email, API key hoặc tài liệu vào analytics.

| Event đề xuất | Khi nào | Thuộc tính an toàn |
| --- | --- | --- |
| `sign_up` | Đăng ký thành công | `method` |
| `login` | Đăng nhập thành công | `method` |
| `project_created` | Tạo project | `project_type` |
| `target_connection_tested` | Test connection xong | `result`, `target_type` |
| `scan_started` | Bắt đầu scan | `test_count`, `target_type` |
| `scan_completed` | Scan kết thúc | `result`, `finding_count` |
| `report_viewed` | Mở report | `risk_level` |
| `retest_completed` | Retest xong | `result` |
| `contact_submitted` | Gửi yêu cầu assessment | `source` |

Web SaaS không có `install` hay `add_to_cart` nếu không có cài đặt/giỏ hàng. Chỉ ghi `purchase` khi thanh toán thật được đối soát.

## 1.9–1.10. Phát hành

GreenShield là **web app**, không có APK/CH Play. Hướng dẫn cho phép website trên tên miền công khai nhưng yêu cầu nhóm trao đổi sớm với giảng viên về quy đổi điểm. Localhost không phải phát hành. Chưa xác minh domain hiện tại có API và lưu trữ bền vững.

Checklist phát hành: logo, ảnh các màn hình, mô tả đúng phạm vi, trang liên hệ, chính sách quyền riêng tư công khai, HTTPS, secret production riêng, sao lưu DB, log không lộ secret, deep link refresh được, tài khoản giảng viên không phải admin mặc định. [README](../README.md) lưu ý Vercel tĩnh không đủ cho Express/SQLite nếu không có backend và storage riêng.

## Minh chứng còn thiếu trước khi nộp

1. Slide/báo cáo EXE101 và 5–10 phỏng vấn thật.
2. Người phụ trách, bảng tiến độ thực tế và ảnh bảng quản lý việc.
3. Link Figma hoặc ảnh phác màn hình.
4. Log test có timestamp, video luồng chính, ảnh schema DB đã che dữ liệu, nhật ký AI.
5. GA4/Firebase có dữ liệu thật và ảnh DebugView/Realtime.
6. Chính sách quyền riêng tư, URL công khai, ảnh sản phẩm và xác nhận cách chấm web từ giảng viên.

Những mục này cần nhóm thực hiện và xác minh ngoài repo; không thể hoàn thành chỉ bằng cách viết tài liệu.
