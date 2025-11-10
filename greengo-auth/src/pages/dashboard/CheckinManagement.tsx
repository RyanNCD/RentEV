// File: src/pages/dashboard/CheckinManagement.tsx

import { useEffect, useState } from "react";
import { type IRentalHistoryItem } from "../../types";
import { getAllRentals, checkInRental, checkOutRental } from "../../services/rental";
import { uploadRentalImage, getRentalImages, type RentalImageItem } from "../../services/upload";

const styles = {
  container: { padding: '2rem', maxWidth: '800px', margin: 'auto' },
  error: { color: 'red', fontWeight: 'bold' },
  loading: { color: 'blue' },
  bookingDetails: { border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', marginBottom: '12px' },
  detailRow: { marginBottom: '8px' },
  actions: { marginTop: '12px', display: 'flex', gap: '10px' },
  btnCheckin: { background: 'green', color: 'white', padding: '10px', border: 'none', cursor: 'pointer' },
  btnCheckout: { background: 'orange', color: 'white', padding: '10px', border: 'none', cursor: 'pointer' }
};

export default function CheckinManagement() {
  const [rentals, setRentals] = useState<IRentalHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog state for handover image/info
  const [showDialog, setShowDialog] = useState(false);
  const [activeRentalId, setActiveRentalId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [imageType, setImageType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [deliveryCondition, setDeliveryCondition] = useState<string>("");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [dialogLoading, setDialogLoading] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [imagesMap, setImagesMap] = useState<Record<string, RentalImageItem[]>>({});

  const loadPaidRentals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllRentals();
      setRentals(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không tải được danh sách đơn thuê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPaidRentals();
  }, []);

  const openDialog = (rentalId: string) => {
    setActiveRentalId(rentalId);
    setImageType("");
    setDescription("");
    setNote("");
    setDeliveryCondition("");
    setFiles(null);
    setDialogError(null);
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setActiveRentalId(null);
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRentalId) {
      setDialogError("Thiếu mã đơn thuê.");
      return;
    }
    if (!files || files.length === 0) {
      setDialogError("Vui lòng chọn ít nhất một ảnh bàn giao.");
      return;
    }
    setDialogLoading(true);
    setDialogError(null);
    try {
      const uploadPromises: Promise<any>[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files.item(i)!;
        uploadPromises.push(uploadRentalImage(f, activeRentalId, imageType || undefined, description || undefined, note || undefined));
      }
      await Promise.all(uploadPromises);

      const updated = await checkInRental(activeRentalId, deliveryCondition || undefined);
      setRentals(prev => prev.map(r => r.rentalId === activeRentalId ? { ...r, status: updated.status } : r));
      closeDialog();
    } catch (err: any) {
      setDialogError(err.response?.data?.message || "Bàn giao thất bại.");
    } finally {
      setDialogLoading(false);
    }
  };

  const toggleViewImages = async (rentalId: string) => {
    const isExpanded = !!expanded[rentalId];
    // Toggle state first
    setExpanded(prev => ({ ...prev, [rentalId]: !isExpanded }));
    if (!isExpanded) {
      // Fetch if not loaded
      if (!imagesMap[rentalId]) {
        try {
          const imgs = await getRentalImages(rentalId);
          setImagesMap(prev => ({ ...prev, [rentalId]: imgs }));
        } catch (err: any) {
          setError(err.response?.data?.message || "Không tải được ảnh bàn giao.");
        }
      }
    }
  };

  const handleCheckOut = async (rentalId: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await checkOutRental(rentalId);
      setRentals(prev => prev.map(r => r.rentalId === rentalId ? { ...r, status: updated.status } : r));
    } catch (err: any) {
      setError(err.response?.data?.message || "Nhận xe thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div style={styles.container}>
      <h1>Danh sách KH đã thanh toán</h1>

      {loading && <p style={styles.loading}>Đang xử lý...</p>}
      {error && <p style={styles.error}>{error}</p>}

      <div>
        {rentals.length === 0 && !loading && <p>Không có đơn.</p>}
        {rentals.map(r => (
          <div key={r.rentalId} style={styles.bookingDetails}>
            <p style={styles.detailRow}><strong>Đơn:</strong> {r.rentalId}</p>
            <p style={styles.detailRow}><strong>Xe:</strong> {r.vehicleName || "Không có tên xe"}</p>
            <p style={styles.detailRow}><strong>Từ:</strong> {r.startTime ? new Date(r.startTime).toLocaleString("vi-VN") : " Không có"}</p>
            <p style={styles.detailRow}><strong>Đến:</strong> {r.endTime ? new Date(r.endTime).toLocaleString("vi-VN") : "Không có"}</p>
            <p style={styles.detailRow}><strong>Trạng thái:</strong> <strong style={{color: 'green'}}>{toVietnameseStatus(r.status)}</strong></p>
          <div style={styles.actions}>
            {isStatusPaid(r.status) && (
              <button style={styles.btnCheckin} onClick={() => openDialog(r.rentalId)}>
                Bàn giao xe
              </button>
            )}
            {isStatusInProgress(r.status) && (
              <button style={styles.btnCheckout} onClick={() => handleCheckOut(r.rentalId)}>
                Nhận xe
              </button>
            )}
            <button style={{ padding: '10px' }} onClick={() => toggleViewImages(r.rentalId)}>
              {expanded[r.rentalId] ? "Ẩn thông tin bàn giao" : "Xem thông tin bàn giao"}
            </button>
          </div>
          {expanded[r.rentalId] && (
            <div style={{ marginTop: '12px' }}>
              <h4>Ảnh/Tin bàn giao</h4>
              {imagesMap[r.rentalId] && imagesMap[r.rentalId].length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                  {imagesMap[r.rentalId].map(img => (
                    <div key={img.imageId} style={{ border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
                      <img src={img.imageUrl} alt={img.description || img.type} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }} />
                      <div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
                        <div><strong>Loại:</strong> {img.type}</div>
                        {img.description && <div><strong>Mô tả:</strong> {img.description}</div>}
                        {img.note && <div><strong>Ghi chú:</strong> {img.note}</div>}
                        {img.createdAt && <div><strong>Ngày:</strong> {new Date(img.createdAt).toLocaleString("vi-VN")}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Chưa có ảnh/tin bàn giao.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
    {showDialog && (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <form onSubmit={handleDialogSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '520px' }}>
          <h2>Thông tin bàn giao xe</h2>
          {dialogError && <p style={{ color: 'red' }}>{dialogError}</p>}
          <div style={{ marginBottom: '10px' }}>
            <label>Loại ảnh (Type)</label>
            <input type="text" value={imageType} onChange={(e) => setImageType(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="VD: Bàn giao, Giấy tờ, Khoảnh khắc" />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Mô tả (Description)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="Mô tả tình trạng khi giao xe"></textarea>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Ghi chú (Note)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="Ghi chú thêm nếu có"></textarea>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Tình trạng khi giao (DeliveryCondition)</label>
            <textarea value={deliveryCondition} onChange={(e) => setDeliveryCondition(e.target.value)} style={{ width: '100%', padding: '8px' }} placeholder="Ví dụ: Pin 80%, ngoại thất sạch, nội thất sạch"></textarea>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Ảnh bàn giao</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={closeDialog} style={{ padding: '8px 12px' }}>Hủy</button>
            <button type="submit" disabled={dialogLoading} style={{ background: 'green', color: '#fff', padding: '8px 12px', border: 'none' }}>
              {dialogLoading ? 'Đang gửi...' : 'Xác nhận bàn giao'}
            </button>
          </div>
        </form>
      </div>
    )}
    </>
  );
}

// Helper: map backend status to Vietnamese label for display
function toVietnameseStatus(status?: string): string {
  const raw = String(status || '').toUpperCase();
  const map: Record<string, string> = {
    BOOKING: 'Đã đặt',
    PENDING: 'Đã đặt',
    PAID: 'Đã thanh toán',
    IN_PROGRESS: 'Đang thuê',
    COMPLETED: 'Hoàn tất',
    CANCELLED: 'Đã hủy',
    CANCELED: 'Đã hủy'
  };
  return map[raw] || status || '';
}

function isStatusPaid(status?: string): boolean {
  return String(status || '').toUpperCase() === 'BOOKING' || String(status || '').toUpperCase() === 'PAID';
}

function isStatusInProgress(status?: string): boolean {
  return String(status || '').toUpperCase() === 'IN_PROGRESS';
}