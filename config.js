// THIỆP NHÀ GÁI. Sửa nội dung thiệp tại đây. Trường nào để "" sẽ tự ẩn.
window.WEDDING = {
  groom: "Anh Vũ",
  bride: "Phương Thảo",

  // Ngày giờ dùng cho đồng hồ đếm ngược (giờ VN). TODO: chỉnh giờ khi chốt.
  date: "2026-11-28T10:00:00+07:00",
  dateText: "28.11.2026",
  weekday: "Thứ Bảy",
  lunarText: "Nhằm ngày 20 tháng 10 năm Bính Ngọ",
  time: "", // TODO: ví dụ "Đón khách 10:00 · Khai tiệc 11:00"

  groomFamily: { title: "Nhà Trai", role: "Trưởng nam", father: "", mother: "", place: "" },
  brideFamily: { title: "Nhà Gái", role: "Ái nữ", father: "", mother: "", place: "" },

  venue: {
    name: "Tư gia Nhà Gái",
    hall: "",
    address: "Qua Cầu Số 1, Mỹ Lợi, Đồng Tháp",
    // Ghim đúng địa điểm trên Google Maps (Áo Cưới - Rạp Cưới Thái Hân)
    mapQuery: "Áo Cưới-Rạp Cưới Thái Hân, Qua Cầu Số 1, Mỹ Lợi, Đồng Tháp",
    mapUrl: "https://www.google.com/maps?q=%C3%81o+C%C6%B0%E1%BB%9Bi-R%E1%BA%A1p+C%C6%B0%E1%BB%9Bi+Th%C3%A1i+H%C3%A2n,+Qua+C%E1%BA%A7u+S%E1%BB%91+1,+M%E1%BB%B9+L%E1%BB%A3i,+%C4%90%E1%BB%93ng+Th%C3%A1p&ftid=0x310a853142889f29:0x79cabf63c73d87ad"
  },

  heroPhoto: "assets/photos/hero.jpg",
  album: ["photo_03", "photo_05", "photo_08", "photo_13", "photo_17", "photo_25"],

  musicFile: "assets/music/nhac-nha-gai.mp3",

  // Lời chúc nhà gái lưu riêng vào wishes-nha-gai.json (xem vercel env WISHES_FILE)
  rsvpEndpoint: "/api/wishes"
};
