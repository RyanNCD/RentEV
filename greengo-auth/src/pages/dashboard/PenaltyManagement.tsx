import { useEffect, useState } from "react";
import { type IPenalty } from "../../types";
import { getPenalties, createPenalty, updatePenalty, deletePenalty } from "../../services/penalty";

const VIOLATION_OPTIONS: { value: string; label: string }[] = [
  { value: "LateReturn", label: "Trả xe trễ giờ" },
  { value: "DamageExterior", label: "Hư hỏng ngoại thất" },
  { value: "DamageInterior", label: "Hư hỏng nội thất" },
  { value: "LostAccessory", label: "Mất phụ kiện" },
  { value: "CleaningFee", label: "Phí vệ sinh" },
];

export default function PenaltyManagement() {
  const [penalties, setPenalties] = useState<IPenalty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingPenalty, setEditingPenalty] = useState<IPenalty | null>(null);
  const [violationType, setViolationType] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEditingPenalty(null);
    setViolationType("");
    setDescription("");
    setAmount(0);
  };

  const loadPenalties = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPenalties();
      setPenalties(data);
    } catch (err: any) {
      console.error("Error loading penalties:", err);
      setError(err.response?.data?.message || "Không thể tải bảng giá phạt.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPenalties();
  }, []);

  const handleEdit = (penalty: IPenalty) => {
    setEditingPenalty(penalty);
    setViolationType(penalty.violationType);
    setDescription(penalty.description);
    setAmount(penalty.amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationType.trim()) {
      setError("Loại vi phạm không được để trống.");
      return;
    }
    if (amount <= 0) {
      setError("Số tiền phạt phải lớn hơn 0.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editingPenalty) {
        await updatePenalty(editingPenalty.penaltyId, {
          violationType: violationType.trim(),
          description: description.trim(),
          amount,
          isActive: true,
        });
      } else {
        // Ensure only one penalty per violation type on FE as well
        const existed = penalties.find(p => p.violationType === violationType.trim());
        if (existed) {
          setError("Mỗi loại vi phạm chỉ được thêm một lần. Vui lòng sửa mức phạt hiện có.");
          setSubmitting(false);
          return;
        }
        await createPenalty({
          violationType: violationType.trim(),
          description: description.trim(),
          amount,
          isActive: true,
        });
      }
      resetForm();
      await loadPenalties();
    } catch (err: any) {
      console.error("Error saving penalty:", err);
      setError(err.response?.data?.message || "Không thể lưu mức phạt.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (penalty: IPenalty) => {
    const viLabel = VIOLATION_OPTIONS.find(o => o.value === penalty.violationType)?.label || penalty.violationType;
    if (!window.confirm(`Bạn chắc chắn muốn xóa mức phạt "${viLabel}"?`)) return;
    try {
      await deletePenalty(penalty.penaltyId);
      await loadPenalties();
    } catch (err: any) {
      console.error("Error deleting penalty:", err);
      setError(err.response?.data?.message || "Không thể xóa mức phạt.");
    }
  };

  const formatPrice = (price?: number | null) => {
    if (price == null) return "—";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div style={{ padding: "1.5rem", background: "#f3f4f6", minHeight: "100%" }}>
      <h1 style={{ marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: 700 }}>Bảng giá phạt</h1>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1.2fr)",
          gap: "1.5rem",
          alignItems: "flex-start",
        }}
      >
        {/* Danh sách */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px rgba(15,23,42,0.1)",
            padding: "1rem 1.25rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", fontWeight: 600 }}>Danh sách mức phạt</h2>
          {loading ? (
            <p>Đang tải...</p>
          ) : penalties.length === 0 ? (
            <p>Chưa có mức phạt nào.</p>
          ) : (
            <div className="table-responsive">
              <table
                className="table table-striped"
                style={{ width: "100%", fontSize: "0.9rem", tableLayout: "fixed" }}
              >
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Loại vi phạm</th>
                    <th style={{ width: "45%" }}>Mô tả</th>
                    <th style={{ width: "15%" }}>Mức phạt</th>
                    <th style={{ width: "15%", textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {penalties.map((p) => {
                    const viLabel = VIOLATION_OPTIONS.find(o => o.value === p.violationType)?.label || p.violationType;
                    return (
                      <tr key={p.penaltyId}>
                        <td style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {viLabel}
                        </td>
                        <td style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p.description}</td>
                        <td>{formatPrice(p.amount)}</td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="btn btn--sm btn--info"
                              onClick={() => handleEdit(p)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm btn--danger"
                              onClick={() => handleDelete(p)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "0.75rem",
            boxShadow: "0 1px 3px rgba(15,23,42,0.1)",
            padding: "1rem 1.25rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", fontWeight: 600 }}>
            {editingPenalty ? "Chỉnh sửa mức phạt" : "Thêm mức phạt mới"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Loại vi phạm *</label>
              <select
                value={violationType}
                onChange={(e) => setViolationType(e.target.value)}
                required
              >
                <option value="">-- Chọn loại vi phạm --</option>
                {VIOLATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Mô tả chi tiết về mức phạt..."
              />
            </div>
            <div className="form-group">
              <label>Mức phạt (VND) *</label>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <button
                type="submit"
                className="btn btn--primary"
                disabled={submitting}
              >
                {submitting ? "Đang lưu..." : editingPenalty ? "Cập nhật" : "Thêm mới"}
              </button>
              {editingPenalty && (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={resetForm}
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


