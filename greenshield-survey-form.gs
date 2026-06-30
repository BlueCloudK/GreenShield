function buildGreenShieldSurvey() {
  const form = FormApp.openById('14Pu6Q6yAREb-Rd-tNmSK_ktfZAS6U1raKu1o6Lu_lKg');

  form.setTitle('Khảo sát nhu cầu kiểm thử bảo mật cho ứng dụng AI - GreenShield');
  form.setDescription(
    'Chúng mình đang nghiên cứu GreenShield, một nền tảng giúp kiểm tra rủi ro bảo mật trong chatbot, RAG system, AI agent và các ứng dụng AI trước khi triển khai. Khảo sát này mất khoảng 3-5 phút.'
  );

  form.addPageBreakItem().setTitle('Thông tin người trả lời');

  form.addMultipleChoiceItem()
    .setTitle('1. Bạn thuộc nhóm nào?')
    .setChoiceValues([
      'Sinh viên / cá nhân học công nghệ',
      'Developer / vibe coder',
      'Founder / startup team',
      'SME / small business',
      'Product / AI team',
      'Khác'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('2. Bạn đã từng xây dựng hoặc sử dụng ứng dụng AI chưa?')
    .setChoiceValues([
      'Chưa từng',
      'Đã dùng AI tools',
      'Đã build chatbot / AI app đơn giản',
      'Đã build RAG / AI agent / AI SaaS'
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('3. Bạn hoặc team của bạn đang dùng AI cho mục đích gì?')
    .setChoiceValues([
      'Chatbot chăm sóc khách hàng',
      'Tìm kiếm / hỏi đáp tài liệu nội bộ',
      'Tự động hóa công việc',
      'Phân tích dữ liệu',
      'Tạo nội dung / marketing',
      'Coding / technical support',
      'Khác'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('4. Ứng dụng AI của bạn có xử lý dữ liệu nhạy cảm không?')
    .setChoiceValues(['Không', 'Có một ít', 'Có nhiều', 'Không chắc'])
    .setRequired(true);

  form.addPageBreakItem().setTitle('Nỗi lo bảo mật AI');

  form.addCheckboxItem()
    .setTitle('5. Bạn lo ngại nhất rủi ro nào khi dùng AI app?')
    .setChoiceValues([
      'Rò rỉ dữ liệu nội bộ',
      'Prompt injection',
      'Lộ API key / logs',
      'AI trả lời sai hoặc bị thao túng',
      'AI agent gọi nhầm tool/API nguy hiểm',
      'Không biết hệ thống có an toàn hay không',
      'Khác'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('6. Bạn có từng nghe về prompt injection chưa?')
    .setChoiceValues([
      'Chưa nghe',
      'Có nghe nhưng chưa hiểu rõ',
      'Hiểu cơ bản',
      'Đã từng test hoặc gặp thực tế'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('7. Bạn có từng nghe về rủi ro bảo mật trong RAG system chưa?')
    .setChoiceValues([
      'Chưa',
      'Có nhưng chưa rõ',
      'Có hiểu cơ bản',
      'Đã từng gặp / xử lý'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('8. Khi deploy AI app, bạn có kiểm thử bảo mật trước không?')
    .setChoiceValues([
      'Không kiểm thử',
      'Tự kiểm tra thủ công',
      'Dùng tool có sẵn',
      'Thuê chuyên gia / pentest',
      'Chưa từng deploy'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('9. Nếu không kiểm thử bảo mật AI, bạn nghĩ hậu quả nghiêm trọng nhất là gì?')
    .setRequired(false);

  form.addScaleItem()
    .setTitle('10. Bạn đánh giá mức độ nghiêm trọng của vấn đề bảo mật AI là?')
    .setBounds(1, 5)
    .setLabels('Không nghiêm trọng', 'Rất nghiêm trọng')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('11. Vấn đề này với bạn/team bạn thuộc loại nào?')
    .setChoiceValues([
      'Candy: có cũng được, không có cũng không sao',
      'Vitamin: hữu ích nhưng chưa cấp bách',
      'Painkiller: cần thiết vì nếu lỗi sẽ gây hậu quả nghiêm trọng',
      'Không chắc'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('12. Bạn nghĩ vấn đề bảo mật AI xuất hiện thường xuyên như thế nào?')
    .setChoiceValues([
      'Hiếm khi',
      'Thỉnh thoảng',
      'Thường xuyên khi cập nhật prompt/model/data',
      'Gần như mỗi lần deploy đều cần kiểm tra'
    ])
    .setRequired(true);

  form.addPageBreakItem().setTitle('Giải pháp hiện tại');

  form.addCheckboxItem()
    .setTitle('13. Hiện tại bạn/team bạn đang giải quyết vấn đề này bằng cách nào?')
    .setChoiceValues([
      'Chưa giải quyết',
      'Tự đọc tài liệu và kiểm tra thủ công',
      'Dùng checklist bảo mật',
      'Dùng security scanner thông thường',
      'Thuê pentest/security consultant',
      'Bug bounty',
      'Khác'
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('14. Khó khăn lớn nhất với các giải pháp hiện tại là gì?')
    .setChoiceValues([
      'Đắt',
      'Mất thời gian',
      'Cần kiến thức cybersecurity',
      'Không tập trung vào AI app',
      'Không biết lỗi nào nghiêm trọng hơn',
      'Report khó hiểu / khó sửa',
      'Khác'
    ])
    .setRequired(true);

  form.addPageBreakItem().setTitle('Đánh giá ý tưởng GreenShield');

  form.addCheckboxItem()
    .setTitle('15. Nếu có một tool scan rủi ro AI app tự động, bạn muốn nó kiểm tra gì?')
    .setChoiceValues([
      'Prompt injection',
      'Rò rỉ dữ liệu trong RAG',
      'API key/log exposure',
      'Unsafe AI agent actions',
      'Endpoint/API exposure',
      'Model/adapters/dataset supply chain risks',
      'Report và fix recommendation'
    ])
    .setRequired(true);

  form.addScaleItem()
    .setTitle('16. Bạn có hứng thú với GreenShield không?')
    .setBounds(1, 5)
    .setLabels('Không hứng thú', 'Rất hứng thú')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('17. Tính năng nào của GreenShield hấp dẫn nhất với bạn?')
    .setChoiceValues([
      'Scan toàn bộ AI pipeline',
      'Local-first scanner',
      'Risk scoring',
      'Automated security report',
      'Fix recommendation',
      'Retest workflow',
      'Dễ dùng cho người không chuyên security'
    ])
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('18. Bạn muốn nhận kết quả kiểm thử dưới dạng nào?')
    .setChoiceValues([
      'Dashboard trực quan',
      'File PDF report',
      'Checklist lỗi cần sửa',
      'Risk score theo mức độ nghiêm trọng',
      'Hướng dẫn fix từng lỗi',
      'Export cho team/client'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('19. Bạn/team bạn sẵn sàng trả bao nhiêu cho công cụ như GreenShield mỗi tháng?')
    .setChoiceValues([
      'Chưa sẵn sàng trả tiền',
      'Dưới $10',
      '$10 - $29',
      '$30 - $99',
      '$100 - $299',
      'Trên $300 nếu dùng cho business'
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('20. Bạn có góp ý gì để GreenShield hữu ích hơn không?')
    .setRequired(false);
}
