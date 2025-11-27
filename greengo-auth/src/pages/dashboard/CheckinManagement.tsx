import { useEffect, useState } from "react";
import { type IRentalHistoryItem, type IStation, type IFeedback, type IPenalty } from "../../types";
import { getRentalsPaged, type RentalListParams, checkInRental, checkOutRental, getRentalById, getFeedbacksByRental, createRentalPenalty, settleRentalPenalty, deleteRentalPenalty, updateRentalPenalty } from "../../services/rental";
import { uploadRentalImage, getRentalImages, type RentalImageItem } from "../../services/upload";
import { getAllStations } from "../../services/station";
import { useAuth } from "../../context/AuthContext";
import { createStationPayOSPayment, confirmStationPayment, getPaymentsByRentalId, type StationPaymentConfirmRequest } from "../../services/payment";
import { getPenalties } from "../../services/penalty";
import { formatVietnamDate, toVietnamTime } from "../../utils/dateTime";
import "../checkin.css";

type ModalType = "checkin" | "checkout" | "detail" | null;

export default function CheckinManagement() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<IRentalHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is staff (can perform check-in/check-out)
  // Staff role is "STAFF" (mapped from "StaffStation" in backend)
  const isStaff = user?.role === "STAFF";
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  // Mặc định filter theo trạm của nhân viên nếu có
  const [stationFilter, setStationFilter] = useState<string>(user?.stationId || "");
  
  // Stations list
  const [stations, setStations] = useState<IStation[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRental, setSelectedRental] = useState<IRentalHistoryItem | null>(null);
  const [rentalImages, setRentalImages] = useState<RentalImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [feedbacks, setFeedbacks] = useState<IFeedback[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  
  // Checkin form state
  const [files, setFiles] = useState<File[]>([]);
  const [imageType, setImageType] = useState<string>("Checkin");
  const [description, setDescription] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [deliveryCondition, setDeliveryCondition] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Checkout form state
  const [returnCondition, setReturnCondition] = useState<string>("");
  const [returnFiles, setReturnFiles] = useState<File[]>([]);
  const [returnNote, setReturnNote] = useState<string>("");
  
  // State để lưu tổng số tiền đã trả từ payments cho mỗi rental
  const [rentalPayments, setRentalPayments] = useState<Record<string, number>>({});

  // Penalty handling state
  const [penaltyCatalog, setPenaltyCatalog] = useState<IPenalty[]>([]);
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<string>("");
  const [penaltyAmount, setPenaltyAmount] = useState<number>(0);
  const [penaltyDescription, setPenaltyDescription] = useState<string>("");
  const [useDepositForPenalty, setUseDepositForPenalty] = useState(true);
  const [penaltySubmitting, setPenaltySubmitting] = useState(false);
  const [editingPenaltyId, setEditingPenaltyId] = useState<string | null>(null);
  const [editingPenaltyAmount, setEditingPenaltyAmount] = useState<number>(0);
  const [editingPenaltyDescription, setEditingPenaltyDescription] = useState<string>("");

  // Station payment state
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "BankTransfer" | "PayOS" | "">("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [payOSCheckoutUrl, setPayOSCheckoutUrl] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadRentals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: RentalListParams = {
        page,
        pageSize,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        stationId: stationFilter || undefined,
      };
      
      // Always use pagination to get consistent format
      const response = await getRentalsPaged(params);
      setRentals(response.items);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
      
      // Fetch payments cho tất cả rentals
      const paymentsMap: Record<string, number> = {};
      await Promise.all(
        response.items.map(async (rental) => {
          try {
            const payments = await getPaymentsByRentalId(rental.rentalId);
            const totalPaid = payments
              .filter(p => p.status?.toUpperCase() === "SUCCESS")
              .reduce((sum, p) => sum + (p.amount || 0), 0);
            paymentsMap[rental.rentalId] = totalPaid;
          } catch (err) {
            console.error(`Error fetching payments for rental ${rental.rentalId}:`, err);
          }
        })
      );
      setRentalPayments(paymentsMap);
    } catch (err: any) {
      console.error("Error loading rentals:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách đơn thuê.");
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    setLoadingStations(true);
    try {
      const data = await getAllStations();
      setStations(data);
    } catch (err: any) {
      console.error("Error loading stations:", err);
    } finally {
      setLoadingStations(false);
    }
  };

  useEffect(() => {
    loadRentals();
  }, [page, pageSize, statusFilter, searchQuery, startDate, endDate, stationFilter]);

  useEffect(() => {
    const fetchPenaltyCatalog = async () => {
      try {
        const data = await getPenalties();
        setPenaltyCatalog(data);
      } catch (err) {
        console.error("Failed to load penalties", err);
      }
    };
    fetchPenaltyCatalog();
  }, []);

  useEffect(() => {
    loadStations();
  }, []);

  // Set filter mặc định theo trạm của nhân viên khi stations được load
  useEffect(() => {
    if (isStaff && user?.stationId && stations.length > 0 && !stationFilter) {
      // Kiểm tra xem stationId của user có trong danh sách stations không
      const userStationExists = stations.some(s => s.stationId === user.stationId);
      if (userStationExists) {
        setStationFilter(user.stationId);
      }
    }
  }, [stations, user?.stationId, isStaff, stationFilter]);

  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    loadRentals();
  };

  const handleResetFilters = () => {
    setStatusFilter("");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    // Reset về trạm của nhân viên nếu là staff, ngược lại reset về rỗng
    setStationFilter(isStaff && user?.stationId ? user.stationId : "");
    setPage(1);
  };

  const openModal = async (type: ModalType, rental: IRentalHistoryItem) => {
    // Fetch payments cho rental này nếu chưa có
    if (!rentalPayments[rental.rentalId]) {
      try {
        const payments = await getPaymentsByRentalId(rental.rentalId);
        const totalPaid = payments
          .filter(p => p.status?.toUpperCase() === "SUCCESS")
          .reduce((sum, p) => sum + (p.amount || 0), 0);
        setRentalPayments(prev => ({ ...prev, [rental.rentalId]: totalPaid }));
      } catch (err) {
        console.error(`Error fetching payments for rental ${rental.rentalId}:`, err);
      }
    }
    setModalType(type);
    setModalError(null);
    
    // Reset form states
    setFiles([]);
    setDescription("");
    setNote("");
    setDeliveryCondition("");
    setReturnCondition("");
    setReturnFiles([]);
    setReturnNote("");
    setImageType("Checkin");
    
    // For detail modal, reload rental from API to get latest contract
    if (type === "detail") {
      try {
        const updatedRental = await getRentalById(rental.rentalId);
        setSelectedRental(updatedRental);
        await loadRentalImages(rental.rentalId);
        // Load feedbacks
        setLoadingFeedbacks(true);
        try {
          const fbs = await getFeedbacksByRental(rental.rentalId);
          setFeedbacks(fbs);
        } finally {
          setLoadingFeedbacks(false);
        }
      } catch (err: any) {
        console.error("Error loading rental detail:", err);
        setModalError("Không thể tải thông tin chi tiết đơn thuê.");
        // Fallback to original rental if API fails
        setSelectedRental(rental);
        await loadRentalImages(rental.rentalId);
        // Try load feedbacks even if rental reload fails
        try {
          const fbs = await getFeedbacksByRental(rental.rentalId);
          setFeedbacks(fbs);
        } catch {}
      }
    } else if (type === "checkout") {
      // For checkout modal, reload rental from API to get latest penalties
      try {
        const updatedRental = await getRentalById(rental.rentalId);
        setSelectedRental(updatedRental);
        await loadRentalImages(rental.rentalId);
      } catch (err: any) {
        console.error("Error loading rental for checkout:", err);
        // Fallback to original rental if API fails
        setSelectedRental(rental);
        await loadRentalImages(rental.rentalId);
      }
    } else {
      // For check-in, use rental from list (no need to reload)
      setSelectedRental(rental);
      // Load images
      if (type === "checkin") {
        await loadRentalImages(rental.rentalId);
      }
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRental(null);
    setRentalImages([]);
    setFeedbacks([]);
    setFiles([]);
    setReturnFiles([]);
    setDescription("");
    setNote("");
    setDeliveryCondition("");
    setReturnCondition("");
    setReturnNote("");
    setImageType("Checkin");
    setModalError(null);
    // Reset payment state
    setPaymentMethod("");
    setPaymentProofFile(null);
    setPaymentProofPreview(null);
    setPayOSCheckoutUrl(null);
    setProcessingPayment(false);
  };

  const loadRentalImages = async (rentalId: string) => {
    setLoadingImages(true);
    try {
      const images = await getRentalImages(rentalId);
      setRentalImages(images);
    } catch (err: any) {
      console.error("Error loading images:", err);
      setModalError("Không thể tải ảnh bàn giao.");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReturn = false) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      if (isReturn) {
        setReturnFiles(fileArray);
      } else {
        setFiles(fileArray);
      }
    }
  };

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaymentProofFile(file);
      setPaymentProofPreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePayOSPayment = async () => {
    if (!selectedRental) return;

    setProcessingPayment(true);
    setModalError(null);

    try {
      const response = await createStationPayOSPayment({ rentalId: selectedRental.rentalId });
      setPayOSCheckoutUrl(response.checkoutUrl);
      // Mở link PayOS trong tab mới
      window.open(response.checkoutUrl, "_blank");
    } catch (err: any) {
      console.error("Error creating PayOS payment:", err);
      setModalError(err.response?.data?.message || "Không thể tạo link thanh toán PayOS.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleConfirmStationPayment = async () => {
    if (!selectedRental || !paymentMethod) return;

    // Validate BankTransfer requires proof image
    if (paymentMethod === "BankTransfer" && !paymentProofFile) {
      setModalError("Vui lòng chọn ảnh chứng từ chuyển khoản.");
      return;
    }

    setProcessingPayment(true);
    setModalError(null);

    try {
      let proofImageUrl = "";

      // Upload proof image if BankTransfer
      if (paymentMethod === "BankTransfer" && paymentProofFile) {
        const uploadResponse = await uploadRentalImage(
          paymentProofFile,
          selectedRental.rentalId,
          "Document",
          "Ảnh chứng từ chuyển khoản",
          "Thanh toán tại trạm"
        );
        proofImageUrl = uploadResponse.url;
      }

      // Confirm payment
      const paymentData: StationPaymentConfirmRequest = {
        rentalId: selectedRental.rentalId,
        paymentMethod: paymentMethod as "Cash" | "BankTransfer",
        paymentProofImageUrl: proofImageUrl || "", // Gửi empty string thay vì undefined để backend không báo lỗi required
      };

      await confirmStationPayment(paymentData);

      // Reload rentals to update status
      await loadRentals();
      
      // Reload selected rental to get updated status
      if (selectedRental) {
        try {
          const updatedRental = await getRentalById(selectedRental.rentalId);
          setSelectedRental(updatedRental);
        } catch (err) {
          console.error("Error reloading rental:", err);
          // Fallback: find updated rental from the list
          const updatedRentals = await getRentalsPaged({
            page: 1,
            pageSize: 100,
            status: undefined,
            search: undefined,
            startDate: undefined,
            endDate: undefined,
            stationId: stationFilter || undefined,
          });
          const foundRental = updatedRentals.items.find(r => r.rentalId === selectedRental.rentalId);
          if (foundRental) {
            setSelectedRental(foundRental);
          }
        }
      }
      
      // Reset payment form
      setPaymentMethod("");
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      setPayOSCheckoutUrl(null);

      // Show success message
      alert("Xác nhận thanh toán thành công!");
    } catch (err: any) {
      console.error("Error confirming station payment:", err);
      setModalError(err.response?.data?.message || "Xác nhận thanh toán thất bại.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRental) return;

    // Kiểm tra thanh toán trước khi check-in
    if (!isRentalPaid(selectedRental)) {
      setModalError("Vui lòng thanh toán trước khi bàn giao xe.");
      return;
    }

    // Kiểm tra thời gian bàn giao: được phép bàn giao từ 1 giờ trước thời gian bắt đầu đến trước thời gian kết thúc
    // Ví dụ: Hẹn 10:00 27/11/2025 - 10:00 28/11/2025 thì được bàn giao từ 09:00 27/11/2025 đến trước 10:00 28/11/2025
    if (selectedRental.startTime) {
      // Sử dụng toVietnamTime để xử lý timezone đúng
      const startTime = toVietnamTime(selectedRental.startTime) || new Date(selectedRental.startTime);
      const now = new Date();
      
      // Tính thời gian sớm nhất có thể bàn giao (1 giờ trước thời gian bắt đầu)
      const earliestDeliveryTime = new Date(startTime.getTime() - 60 * 60 * 1000);
      
      // Không được bàn giao quá sớm (trước 1 giờ trước thời gian bắt đầu)
      if (now < earliestDeliveryTime) {
        // Truyền string trực tiếp để formatVietnamDate xử lý timezone
        const startTimeStr = formatVietnamDate(selectedRental.startTime, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        const earliestStr = formatVietnamDate(earliestDeliveryTime, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        const nowStr = formatVietnamDate(now, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        setModalError(`Không thể bàn giao xe quá sớm. Chỉ được phép bàn giao từ ${earliestStr} (1 giờ trước thời gian bắt đầu ${startTimeStr}). Thời gian hiện tại: ${nowStr}.`);
        return;
      }
    }
    
    // Không được bàn giao sau thời gian kết thúc
    if (selectedRental.endTime) {
      // Sử dụng toVietnamTime để xử lý timezone đúng
      const endTime = toVietnamTime(selectedRental.endTime) || new Date(selectedRental.endTime);
      const now = new Date();
      
      if (now >= endTime) {
        // Truyền string trực tiếp để formatVietnamDate xử lý timezone
        const endTimeStr = formatVietnamDate(selectedRental.endTime, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        const nowStr = formatVietnamDate(now, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        setModalError(`Không thể bàn giao xe sau thời gian kết thúc (${endTimeStr}). Thời gian hiện tại: ${nowStr}.`);
        return;
      }
    }

    if (files.length === 0) {
      setModalError("Vui lòng chọn ít nhất một ảnh bàn giao.");
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      // Upload images
      const uploadPromises = files.map(file =>
        uploadRentalImage(file, selectedRental.rentalId, imageType, description, note)
      );
      await Promise.all(uploadPromises);

      // Perform checkin
      await checkInRental(selectedRental.rentalId, deliveryCondition || undefined);
      
      // Reload rentals
      await loadRentals();
      closeModal();
    } catch (err: any) {
      console.error("Error during checkin:", err);
      setModalError(err.response?.data?.message || "Bàn giao xe thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRental) return;

    if (returnFiles.length === 0) {
      setModalError("Vui lòng chọn ít nhất một ảnh tình trạng xe khi nhận lại.");
      return;
    }

    if (!returnCondition.trim()) {
      setModalError("Vui lòng nhập tình trạng xe khi nhận lại.");
      return;
    }

    setSubmitting(true);
    setModalError(null);

    try {
      // Upload return images
      const uploadPromises = returnFiles.map(file =>
        uploadRentalImage(file, selectedRental.rentalId, "Checkout", returnCondition, returnNote)
      );
      await Promise.all(uploadPromises);

      // Perform checkout
      await checkOutRental(selectedRental.rentalId);
      
      // Reload rentals
      await loadRentals();
      closeModal();
    } catch (err: any) {
      console.error("Error during checkout:", err);
      setModalError(err.response?.data?.message || "Nhận xe thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePenaltyTypeChange = (penaltyId: string) => {
    setSelectedPenaltyId(penaltyId);
    const selected = penaltyCatalog.find((p) => p.penaltyId === penaltyId);
    if (selected) {
      setPenaltyAmount(selected.amount);
      if (!penaltyDescription) {
        setPenaltyDescription(selected.description);
      }
    }
  };

  const handleCreatePenalty = async () => {
    if (!selectedRental || !selectedPenaltyId || penaltyAmount <= 0) {
      setModalError("Vui lòng chọn loại phạt và nhập số tiền hợp lệ.");
      return;
    }

    // Kiểm tra nếu penalty liên quan đến "Trả xe trước thời hạn" thì cần có yêu cầu từ khách hàng
    const selectedPenalty = penaltyCatalog.find((p) => p.penaltyId === selectedPenaltyId);
    if (selectedPenalty) {
      const violationType = selectedPenalty.violationType?.toLowerCase() || "";
      if (violationType.includes("early") || violationType.includes("trả xe trước") || violationType === "earlyreturn") {
        if (!selectedRental.earlyReturnRequested) {
          setModalError("⚠️ Trả xe trước thời hạn: Cần có yêu cầu từ khách hàng trước khi nhận xe.");
          return;
        }
      }
    }

    setPenaltySubmitting(true);
    setModalError(null);
    try {
      await createRentalPenalty(selectedRental.rentalId, {
        penaltyId: selectedPenaltyId,
        amount: penaltyAmount,
        description: penaltyDescription,
        useDepositFirst: useDepositForPenalty,
      });
      await loadRentals();
      const rental = await getRentalById(selectedRental.rentalId);
      setSelectedRental(rental);
      setSelectedPenaltyId("");
      setPenaltyAmount(0);
      setPenaltyDescription("");
    } catch (err: any) {
      console.error("Error creating penalty:", err);
      setModalError(err.response?.data?.message || "Không thể tạo khoản phạt.");
    } finally {
      setPenaltySubmitting(false);
    }
  };

  const handleSettlePenalty = async (penaltyId: string, mode: "deposit" | "cash", remaining: number) => {
    if (!selectedRental) return;

    let payloadAmount = 0;
    let useDeposit = false;
    let paymentMethod = "Cash";

    if (mode === "deposit") {
      useDeposit = true;
    } else {
      const promptValue = window.prompt("Nhập số tiền khách đã thanh toán", remaining.toString());
      if (!promptValue) return;
      const amount = Number(promptValue);
      if (Number.isNaN(amount) || amount <= 0) {
        alert("Số tiền không hợp lệ.");
        return;
      }
      payloadAmount = amount;
      paymentMethod = "Cash";
    }

    setPenaltySubmitting(true);
    setModalError(null);
    try {
      await settleRentalPenalty(penaltyId, {
        paymentAmount: payloadAmount,
        paymentMethod,
        useDeposit,
      });
      await loadRentals();
      const rental = await getRentalById(selectedRental.rentalId);
      setSelectedRental(rental);
    } catch (err: any) {
      console.error("Error settling penalty:", err);
      setModalError(err.response?.data?.message || "Không thể cập nhật khoản phạt.");
    } finally {
      setPenaltySubmitting(false);
    }
  };

  const handleDeletePenalty = async (penaltyId: string) => {
    if (!selectedRental) return;
    
    if (!window.confirm("Bạn có chắc chắn muốn xóa khoản phạt này? Nếu đã trừ cọc, tiền cọc sẽ được hoàn lại.")) {
      return;
    }

    setPenaltySubmitting(true);
    setModalError(null);
    try {
      await deleteRentalPenalty(penaltyId);
      await loadRentals();
      const rental = await getRentalById(selectedRental.rentalId);
      setSelectedRental(rental);
    } catch (err: any) {
      console.error("Error deleting penalty:", err);
      setModalError(err.response?.data?.message || "Không thể xóa khoản phạt.");
    } finally {
      setPenaltySubmitting(false);
    }
  };

  const handleEditPenalty = (penalty: any) => {
    setEditingPenaltyId(penalty.rentalPenaltyId);
    setEditingPenaltyAmount(penalty.amount);
    setEditingPenaltyDescription(penalty.description || "");
  };

  const handleCancelEdit = () => {
    setEditingPenaltyId(null);
    setEditingPenaltyAmount(0);
    setEditingPenaltyDescription("");
  };

  const handleUpdatePenalty = async (penaltyId: string) => {
    if (!selectedRental || editingPenaltyAmount <= 0) {
      setModalError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    setPenaltySubmitting(true);
    setModalError(null);
    try {
      await updateRentalPenalty(penaltyId, {
        amount: editingPenaltyAmount,
        description: editingPenaltyDescription,
      });
      await loadRentals();
      const rental = await getRentalById(selectedRental.rentalId);
      setSelectedRental(rental);
      handleCancelEdit();
    } catch (err: any) {
      console.error("Error updating penalty:", err);
      setModalError(err.response?.data?.message || "Không thể cập nhật khoản phạt.");
    } finally {
      setPenaltySubmitting(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    return formatVietnamDate(dateString, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price?: number | null) => {
    if (price == null || price === 0) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getStatusBadgeClass = (status: string) => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === "PAID" || upperStatus === "BOOKING") return "status-paid";
    if (upperStatus === "IN_PROGRESS") return "status-in-progress";
    if (upperStatus === "COMPLETED") return "status-completed";
    if (upperStatus === "CANCELLED" || upperStatus === "CANCELED") return "status-cancelled";
    return "status-pending";
  };

  const getStatusLabel = (status: string) => {
    const upperStatus = status.toUpperCase();
    const map: Record<string, string> = {
      BOOKING: "Đã đặt",
      PENDING: "Chờ thanh toán",
      PAID: "Đã thanh toán",
      IN_PROGRESS: "Đang thuê",
      COMPLETED: "Hoàn tất",
      CANCELLED: "Đã hủy",
      CANCELED: "Đã hủy",
    };
    return map[upperStatus] || status;
  };

  const canCheckin = (status: string) => {
    const upperStatus = status.toUpperCase();
    // Cho phép check-in nếu đã thanh toán hoặc đang booking (có thể thanh toán tại trạm)
    return upperStatus === "PAID" || upperStatus === "BOOKING";
  };

  // Kiểm tra xem rental đã thanh toán chưa (dựa vào status)
  const isRentalPaid = (rental: IRentalHistoryItem) => {
    const paymentStatus = getPaymentStatus(rental);
    // Đã trả đủ nếu paymentStatus.type === "full"
    return paymentStatus.type === "full";
  };

  const canCheckout = (status: string) => {
    return status.toUpperCase() === "IN_PROGRESS";
  };

  // Kiểm tra trạng thái thanh toán: đã trả đủ hay chỉ trả cọc
  // Logic: Cọc 30% là riêng, không tính vào tiền thuê
  // - Tiền thuê xe: rental.totalCost (ví dụ: 4.500.000 ₫)
  // - Tiền cọc: 30% của tiền thuê (ví dụ: 1.350.000 ₫)
  // - Tổng thanh toán nếu trả trước: tiền thuê + cọc (ví dụ: 5.850.000 ₫)
  // - Nếu chỉ trả cọc: đã trả cọc, còn phải trả tiền thuê xe
  // LƯU Ý: Không dựa vào rental.status vì backend set status = "PAID" ngay cả khi chỉ trả cọc
  // Phải kiểm tra số tiền thực tế đã trả
  const getPaymentStatus = (rental: IRentalHistoryItem) => {
    const upperStatus = rental.status?.toUpperCase() || "";
    
    // Chỉ COMPLETED mới chắc chắn đã hoàn tất (không kiểm tra số tiền)
    if (upperStatus === "COMPLETED") {
      return { 
        type: "full", 
        label: "Đã hoàn tất", 
        color: "#059669",
        remaining: 0,
        rentalCost: rental.totalCost || 0,
        depositAmount: rental.deposit?.amount || 0
      };
    }
    
    if (!rental.deposit || !rental.totalCost) {
      return { type: "unknown", label: "Chưa có thông tin", color: "#6b7280" };
    }
    
    const depositAmount = rental.deposit.amount;
    const rentalCost = rental.totalCost; // Tiền thuê xe
    const expectedDeposit = rentalCost * 0.3; // Cọc 30% của tiền thuê
    const totalPaymentRequired = rentalCost + expectedDeposit; // Tổng cần trả nếu trả trước
    
    // Lấy tổng số tiền đã trả từ payments (đã fetch trước đó)
    const totalPaidFromPayments = rentalPayments[rental.rentalId] || 0;
    
    // Tổng số tiền đã trả = deposit + payments thành công
    const totalPaid = depositAmount + totalPaidFromPayments;
    
    // Nếu đã trả >= tổng (tiền thuê + cọc) thì đã trả đủ
    // Sử dụng tolerance nhỏ để tránh lỗi làm tròn số
    if (totalPaid >= totalPaymentRequired - 0.01) {
      return { 
        type: "full", 
        label: "Đã trả đủ", 
        color: "#059669",
        remaining: 0,
        rentalCost: rentalCost,
        depositAmount: depositAmount,
        totalPaid: totalPaid
      };
    }
    
    // Nếu chỉ trả cọc (deposit < tổng) thì còn phải trả tiền thuê xe
    // Còn phải trả = tiền thuê xe (không trừ cọc vì cọc là riêng)
    return { 
      type: "deposit_only", 
      label: "Chỉ trả cọc", 
      color: "#f59e0b",
      remaining: rentalCost, // Còn phải trả tiền thuê xe
      depositAmount: depositAmount,
      rentalCost: rentalCost,
      totalPaymentRequired: totalPaymentRequired,
      totalPaid: totalPaid
    };
  };

  const getImageTypeLabel = (type: string) => {
    const typeUpper = type?.toUpperCase() || "";
    const typeMap: Record<string, string> = {
      "CHECKIN": "Bàn giao",
      "CHECKOUT": "Nhận xe",
      "CONDITION": "Tình trạng",
      "DOCUMENT": "Giấy tờ",
      "BÀN GIAO": "Bàn giao",
      "NHẬN XE": "Nhận xe",
      "TÌNH TRẠNG": "Tình trạng",
      "GIẤY TỜ": "Giấy tờ",
    };
    return typeMap[typeUpper] || type || "Không xác định";
  };

  // Dịch violationType sang tiếng Việt
  const translateViolationType = (violationType: string): string => {
    const typeMap: Record<string, string> = {
      "LateReturn": "Trả xe trễ giờ",
      "DamageExterior": "Hư hỏng ngoại thất",
      "DamageInterior": "Hư hỏng nội thất",
      "LostAccessory": "Mất phụ kiện",
      "CleaningFee": "Phí vệ sinh",
    };
    return typeMap[violationType] || violationType;
  };

  // Dịch penalty status sang tiếng Việt
  const translatePenaltyStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      "Pending": "Chờ xử lý",
      "Settled": "Đã thanh toán",
      "OffsetFromDeposit": "Đã trừ cọc",
    };
    return statusMap[status] || status;
  };

  // Dịch deposit status sang tiếng Việt
  const translateDepositStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      "Pending": "Chờ xử lý",
      "PartiallyUsed": "Đã sử dụng một phần",
      "FullyUsed": "Đã sử dụng hết",
      "Refunded": "Đã hoàn tiền",
      "Completed": "Đã hoàn tất",
    };
    return statusMap[status] || status;
  };

  return (
    <div className="checkin-container">
      <div className="checkin-header">
        <h1>Quản lý bàn giao/nhận xe</h1>
        {!isStaff && (
          <p style={{ color: "#666", fontSize: "14px", marginTop: "8px" }}>
            (Chế độ xem: Bạn chỉ có thể xem thông tin, không thể thực hiện bàn giao/nhận xe)
          </p>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="checkin-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Tìm kiếm</label>
            <input style={{width: "90%", padding: "0.5rem", borderRadius: "0.5rem",
             border: "1px solid #ccc", fontSize: "0.875rem", fontWeight: "400", color: "#374151", outline: "none", height: "auto"}}
              type="text"
              placeholder="Tên xe, khách hàng, mã đơn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="filter-group">
            <label>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="PAID">Đã thanh toán</option>
              <option value="BOOKING">Đã đặt</option>
              <option value="IN_PROGRESS">Đang thuê</option>
              <option value="COMPLETED">Hoàn tất</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Từ ngày</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Đến ngày</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Trạm</label>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              disabled={loadingStations}
            >
              <option value="">Tất cả trạm</option>
              {stations.map((station) => (
                <option key={station.stationId} value={station.stationId}>
                  {station.stationName}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button onClick={handleSearch} className="btn btn--primary">
              Tìm kiếm
            </button>
            <button onClick={handleResetFilters} className="btn btn--secondary">
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="checkin-table-container">
        {loading ? (
          <div className="text-center">Đang tải...</div>
        ) : rentals.length === 0 ? (
          <div className="text-center">Không có đơn thuê nào.</div>
        ) : (
          <>
            <table className="checkin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Xe</th>
                  <th>Trạm lấy</th>
                  <th>Trạm trả</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian kết thúc</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => {
                  const paymentStatus = getPaymentStatus(rental);
                  return (
                    <tr key={rental.rentalId}>
                      <td>
                        <span className="rental-id">
                          {rental.rentalId.substring(0, 8)}...
                        </span>
                      </td>
                      <td>{rental.userName || "N/A"}</td>
                      <td>{rental.vehicleName || "N/A"}</td>
                      <td>{rental.pickupStationName || "N/A"}</td>
                      <td>{rental.returnStationName || "N/A"}</td>
                      <td>{formatDate(rental.startTime)}</td>
                      <td>{formatDate(rental.endTime)}</td>
                      <td>{formatPrice(rental.totalCost)}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span 
                            style={{ 
                              fontSize: "12px", 
                              fontWeight: "600", 
                              color: paymentStatus.color,
                              padding: "4px 8px",
                              borderRadius: "4px",
                              background: paymentStatus.type === "deposit_only" ? "#fef3c7" : paymentStatus.type === "full" ? "#d1fae5" : "#f3f4f6",
                              display: "inline-block",
                              width: "fit-content"
                            }}
                          >
                            {paymentStatus.label}
                          </span>
                          {paymentStatus.type === "deposit_only" && paymentStatus.remaining !== undefined && (
                            <span style={{ fontSize: "11px", color: "#6b7280" }}>
                              Còn: {formatPrice(paymentStatus.remaining)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(rental.status)}`}>
                          {getStatusLabel(rental.status)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* Chỉ Staff mới được bàn giao/nhận xe, Admin chỉ xem */}
                          {isStaff && canCheckin(rental.status) && (
                            <button
                              onClick={() => openModal("checkin", rental)}
                              className="btn btn--sm btn--success"
                            >
                              Bàn giao
                            </button>
                          )}
                          {isStaff && canCheckout(rental.status) && (
                            <button
                              onClick={() => openModal("checkout", rental)}
                              className="btn btn--sm btn--warning"
                            >
                              Nhận xe
                            </button>
                          )}
                          <button
                            onClick={() => openModal("detail", rental)}
                            className="btn btn--sm btn--info"
                          >
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} của {totalCount} đơn
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn--sm"
                >
                  Trước
                </button>
                <span className="pagination-page">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn btn--sm"
                >
                  Sau
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="page-size-select"
                >
                  <option value="5">5 / trang</option>
                  <option value="10">10 / trang</option>
                  <option value="20">20 / trang</option>
                  <option value="50">50 / trang</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Checkin Modal */}
      {modalType === "checkin" && selectedRental && (
        <Modal
          title="Bàn giao xe"
          onClose={closeModal}
          onSubmit={handleCheckin}
          submitting={submitting}
          error={modalError}
        >
          <div className="modal-rental-info">
            <p><strong>Mã đơn:</strong> {selectedRental.rentalId}</p>
            <p><strong>Xe:</strong> {selectedRental.vehicleName}</p>
            <p><strong>Khách hàng:</strong> {selectedRental.userName}</p>
            <p><strong>Thời gian:</strong> {formatDate(selectedRental.startTime)} - {formatDate(selectedRental.endTime)}</p>
            <p><strong>Tổng tiền:</strong> {formatPrice(selectedRental.totalCost)}</p>
            {selectedRental.startTime && selectedRental.endTime && (() => {
              // Sử dụng toVietnamTime để xử lý timezone đúng
              const startTime = toVietnamTime(selectedRental.startTime) || new Date(selectedRental.startTime);
              const endTime = toVietnamTime(selectedRental.endTime) || new Date(selectedRental.endTime);
              const now = new Date();
              
              // Tính thời gian sớm nhất có thể bàn giao (1 giờ trước thời gian bắt đầu)
              const earliestDeliveryTime = new Date(startTime.getTime() - 60 * 60 * 1000);
              
              // Hiển thị thời gian với timezone Vietnam - truyền string trực tiếp để formatVietnamDate xử lý timezone
              const startTimeStr = formatVietnamDate(selectedRental.startTime, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              
              const endTimeStr = formatVietnamDate(selectedRental.endTime, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              
              const earliestStr = formatVietnamDate(earliestDeliveryTime, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              
              // Không được bàn giao quá sớm (trước 1 giờ trước thời gian bắt đầu)
              if (now < earliestDeliveryTime) {
                return (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    border: "2px solid #ef4444",
                    color: "#991b1b"
                  }}>
                    <p style={{ margin: 0, fontWeight: "600" }}>
                      ⚠️ Cảnh báo: Không thể bàn giao quá sớm
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                      Chỉ được phép bàn giao từ {earliestStr} (1 giờ trước thời gian bắt đầu {startTimeStr}).
                    </p>
                  </div>
                );
              }
              
              // Không được bàn giao sau thời gian kết thúc
              if (now >= endTime) {
                return (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#fee2e2",
                    border: "2px solid #ef4444",
                    color: "#991b1b"
                  }}>
                    <p style={{ margin: 0, fontWeight: "600" }}>
                      ⚠️ Cảnh báo: Không thể bàn giao sau thời gian kết thúc
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                      Thời gian kết thúc: {endTimeStr}. Vui lòng kiểm tra lại đơn thuê.
                    </p>
                  </div>
                );
              }
              
              // Tính thời gian còn lại đến thời gian kết thúc
              const timeToEnd = endTime.getTime() - now.getTime();
              const hoursToEnd = Math.floor(timeToEnd / (1000 * 60 * 60));
              const minutesToEnd = Math.floor((timeToEnd % (1000 * 60 * 60)) / (1000 * 60));
              
              // Tính thời gian từ bây giờ đến thời gian bắt đầu
              const timeToStart = startTime.getTime() - now.getTime();
              const hoursToStart = timeToStart / (1000 * 60 * 60);
              
              // Nếu đã qua thời gian bắt đầu
              if (now >= startTime) {
                return (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#fef3c7",
                    border: "2px solid #f59e0b",
                    color: "#92400e"
                  }}>
                    <p style={{ margin: 0, fontWeight: "600" }}>
                      ⏰ Lưu ý: Đã qua thời gian bắt đầu
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                      Thời gian bắt đầu: {startTimeStr}. Thời gian kết thúc: {endTimeStr}. Còn lại đến kết thúc: {hoursToEnd} giờ {minutesToEnd} phút.
                    </p>
                  </div>
                );
              }
              
              // Nếu còn ít hơn 2 giờ đến thời gian bắt đầu
              if (hoursToStart < 2) {
                return (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "#fef3c7",
                    border: "2px solid #f59e0b",
                    color: "#92400e"
                  }}>
                    <p style={{ margin: 0, fontWeight: "600" }}>
                      ⏰ Lưu ý: Thời gian bàn giao
                    </p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                      Thời gian bắt đầu: {startTimeStr}. Thời gian kết thúc: {endTimeStr}. Còn lại đến bắt đầu: {Math.floor(hoursToStart)} giờ {Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60))} phút.
                    </p>
                  </div>
                );
              }
              
              // Thời gian hợp lệ
              return (
                <div style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#d1fae5",
                  border: "2px solid #059669",
                  color: "#065f46"
                }}>
                  <p style={{ margin: 0, fontWeight: "600" }}>
                    ✓ Thời gian bàn giao hợp lệ
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "14px" }}>
                      Thời gian bắt đầu: {startTimeStr}. Thời gian kết thúc: {endTimeStr}. Còn lại đến bắt đầu: {Math.floor(hoursToStart)} giờ {Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60))} phút.
                    </p>
                </div>
              );
            })()}
            {(() => {
              const paymentStatus = getPaymentStatus(selectedRental);
              return (
                <div style={{ 
                  marginTop: "12px", 
                  padding: "12px", 
                  borderRadius: "8px",
                  background: paymentStatus.type === "deposit_only" ? "#fef3c7" : paymentStatus.type === "full" ? "#d1fae5" : "#f3f4f6",
                  border: `2px solid ${paymentStatus.color}`
                }}>
                  <p style={{ margin: 0, marginBottom: "8px" }}>
                    <strong>Trạng thái thanh toán:</strong>{" "}
                    <span style={{ color: paymentStatus.color, fontWeight: "600" }}>
                      {paymentStatus.label}
                    </span>
                  </p>
                  {paymentStatus.type === "deposit_only" && (
                    <div style={{ fontSize: "14px", marginTop: "8px" }}>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Tiền thuê xe:</strong> {formatPrice(paymentStatus.rentalCost)}
                      </p>
                      <p style={{ margin: "4px 0" }}>
                        <strong>Đã trả cọc:</strong> {formatPrice(paymentStatus.depositAmount)}
                      </p>
                      <p style={{ margin: "4px 0", color: "#dc2626", fontWeight: "600" }}>
                        <strong>⚠️ Còn phải thanh toán khi nhận xe:</strong> {formatPrice(paymentStatus.remaining)} (tiền thuê xe)
                      </p>
                    </div>
                  )}
                  {paymentStatus.type === "full" && (
                    <p style={{ margin: "4px 0", fontSize: "14px", color: "#059669" }}>
                      ✓ Khách hàng đã thanh toán đủ số tiền
                    </p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Payment Section - Only show if not paid */}
          {!isRentalPaid(selectedRental) && (
            <div className="form-group" style={{ border: "2px solid #fbbf24", borderRadius: "8px", padding: "16px", marginBottom: "20px", background: "#fffbeb" }}>
              <h3 style={{ marginTop: 0, marginBottom: "16px", color: "#92400e", fontSize: "16px", fontWeight: "600" }}>
                💳 Thanh toán tại trạm
              </h3>
              
              <div className="form-group">
                <label>Phương thức thanh toán *</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => {
                    setPaymentMethod(e.target.value as "Cash" | "BankTransfer" | "PayOS");
                    if (e.target.value !== "BankTransfer") {
                      setPaymentProofFile(null);
                      setPaymentProofPreview(null);
                    }
                  }}
                  disabled={processingPayment}
                >
                  <option value="">-- Chọn phương thức --</option>
                  <option value="Cash">Tiền mặt</option>
                  <option value="BankTransfer">Chuyển khoản</option>
                  <option value="PayOS">PayOS (QR Code)</option>
                </select>
              </div>

              {paymentMethod === "BankTransfer" && (
                <div className="form-group">
                  <label>Ảnh chứng từ chuyển khoản *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentProofChange}
                    disabled={processingPayment}
                  />
                  {paymentProofPreview && (
                    <div className="image-preview" style={{ marginTop: "12px" }}>
                      <img
                        src={paymentProofPreview}
                        alt="Payment proof preview"
                        className="preview-image"
                        style={{ maxWidth: "200px", maxHeight: "200px" }}
                      />
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "PayOS" && (
                <div className="form-group">
                  {payOSCheckoutUrl ? (
                    <div style={{ padding: "12px", background: "#d1fae5", borderRadius: "6px", marginTop: "8px" }}>
                      <p style={{ margin: 0, color: "#065f46", fontWeight: "500" }}>
                        ✓ Link thanh toán đã được tạo. Vui lòng mở link để thanh toán.
                      </p>
                      <a 
                        href={payOSCheckoutUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: "inline-block", marginTop: "8px", color: "#059669", textDecoration: "underline" }}
                      >
                        Mở link thanh toán
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCreatePayOSPayment}
                      disabled={processingPayment}
                      className="btn btn--primary"
                      style={{ width: "100%", marginTop: "8px" }}
                    >
                      {processingPayment ? "Đang tạo..." : "Tạo link thanh toán PayOS"}
                    </button>
                  )}
                </div>
              )}

              {(paymentMethod === "Cash" || paymentMethod === "BankTransfer") && (
                <button
                  type="button"
                  onClick={handleConfirmStationPayment}
                  disabled={processingPayment || (paymentMethod === "BankTransfer" && !paymentProofFile)}
                  className="btn btn--success"
                  style={{ width: "100%", marginTop: "8px" }}
                >
                  {processingPayment ? "Đang xử lý..." : `Xác nhận thanh toán ${paymentMethod === "Cash" ? "tiền mặt" : "chuyển khoản"}`}
                </button>
              )}

              <div style={{ marginTop: "12px", padding: "8px", background: "#fef3c7", borderRadius: "4px", fontSize: "13px", color: "#92400e" }}>
                ⚠️ Vui lòng hoàn tất thanh toán trước khi bàn giao xe.
              </div>
            </div>
          )}
          
          <div className="form-group">
            <label>Loại ảnh *</label>
            <select value={imageType} onChange={(e) => setImageType(e.target.value)}>
              <option value="Checkin">Bàn giao</option>
              <option value="Checkout">Nhận xe</option>
              <option value="Condition">Tình trạng</option>
              <option value="Document">Giấy tờ</option>
            </select>
          </div>

          <div className="form-group">
            <label>Mô tả tình trạng</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tình trạng xe khi giao..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm nếu có..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Tình trạng khi giao *</label>
            <textarea
              value={deliveryCondition}
              onChange={(e) => setDeliveryCondition(e.target.value)}
              placeholder="Ví dụ: Pin 80%, ngoại thất sạch, nội thất sạch..."
              rows={3}
              required
            />
          </div>

          <div className="form-group">
            <label>Ảnh bàn giao * (ít nhất 1 ảnh)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, false)}
            />
            {files.length > 0 && (
              <div className="image-preview">
                {files.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="preview-image"
                  />
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Checkout Modal */}
      {modalType === "checkout" && selectedRental && (
        <Modal
          title="Nhận xe"
          onClose={closeModal}
          onSubmit={handleCheckout}
          submitting={submitting}
          error={modalError}
        >
          <div className="modal-rental-info">
            <p><strong>Mã đơn:</strong> {selectedRental.rentalId}</p>
            <p><strong>Xe:</strong> {selectedRental.vehicleName}</p>
            <p><strong>Khách hàng:</strong> {selectedRental.userName}</p>
            <p><strong>Thời gian:</strong> {formatDate(selectedRental.startTime)} - {formatDate(selectedRental.endTime)}</p>
            {(() => {
              const endTime = selectedRental.endTime ? new Date(selectedRental.endTime) : null;
              const isEarlyReturn = endTime && new Date() < endTime;
              const hasRequest = selectedRental.earlyReturnRequested === true;
              
              if (isEarlyReturn) {
                return (
                  <div style={{ 
                    marginTop: "12px", 
                    padding: "12px", 
                    background: hasRequest ? "#d1fae5" : "#fef3c7", 
                    borderRadius: "6px",
                    border: `1px solid ${hasRequest ? "#10b981" : "#f59e0b"}`
                  }}>
                    {hasRequest ? (
                      <p style={{ margin: 0, color: "#065f46", fontWeight: "500" }}>
                        ✓ Khách hàng đã yêu cầu trả xe sớm
                        {selectedRental.earlyReturnRequestedAt && (
                          <span style={{ fontSize: "12px", display: "block", marginTop: "4px" }}>
                            Thời gian yêu cầu: {formatDate(selectedRental.earlyReturnRequestedAt)}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: "#92400e", fontWeight: "500" }}>
                        ⚠️ Trả xe trước thời hạn: Cần có yêu cầu từ khách hàng trước khi nhận xe.
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="form-group">
            <label>Tình trạng xe khi nhận lại *</label>
            <textarea
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              placeholder="Mô tả chi tiết tình trạng xe khi nhận lại (bắt buộc)..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label>Ghi chú</label>
            <textarea
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="Ghi chú thêm nếu có..."
              rows={2}
            />
          </div>

          <div className="form-group">
            <label>Ảnh tình trạng xe * (ít nhất 1 ảnh)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e, true)}
            />
            {returnFiles.length > 0 && (
              <div className="image-preview">
                {returnFiles.map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="preview-image"
                  />
                ))}
              </div>
            )}
          </div>

          {selectedRental.deposit && (
            <div className="deposit-summary" style={{ marginTop: "16px" }}>
              <h3>Thông tin cọc</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Đã nộp:</strong> {formatPrice(selectedRental.deposit.amount)}
                </div>
                <div className="info-item">
                  <strong>Đã dùng:</strong> {formatPrice(selectedRental.deposit.usedAmount)}
                </div>
                <div className="info-item">
                  <strong>Còn lại:</strong> {formatPrice(selectedRental.deposit.availableAmount)}
                </div>
                <div className="info-item">
                  <strong>Trạng thái:</strong> {translateDepositStatus(selectedRental.deposit.status)}
                </div>
              </div>
            </div>
          )}

          <div className="penalty-section" style={{ marginTop: "24px" }}>
            <h3 style={{ marginBottom: "16px", fontSize: "18px", fontWeight: "600", color: "#1f2937" }}>Khoản phạt hư hỏng</h3>
            {!selectedRental.penalties || selectedRental.penalties.length === 0 ? (
              <div style={{ color: "#6b7280", padding: "16px", textAlign: "center", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>Chưa có khoản phạt nào.</div>
            ) : (
              <div className="table-responsive" style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}>
                <table className="table table-striped" style={{ fontSize: "14px", width: "100%", tableLayout: "auto", borderCollapse: "separate", borderSpacing: 0, margin: 0 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      <th style={{ width: "25%", textAlign: "left", padding: "12px 16px", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Loại</th>
                      <th style={{ width: "12%", textAlign: "center", padding: "12px 16px", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Số tiền</th>
                      <th style={{ width: "12%", textAlign: "center", padding: "12px 16px", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Đã trừ cọc</th>
                      <th style={{ width: "12%", textAlign: "center", padding: "12px 16px", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Đã thu</th>
                      <th style={{ width: "15%", textAlign: "left", padding: "12px 16px", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Trạng thái</th>
                      <th style={{ width: "24%", textAlign: "left", padding: "12px 16px", fontWeight: "600", color: "#374151", borderBottom: "2px solid #e5e7eb", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRental.penalties.map((penalty, index) => {
                      const remaining = penalty.amount - penalty.depositUsedAmount - penalty.paidAmount;
                      return (
                        <tr 
                          key={penalty.rentalPenaltyId}
                          style={{ 
                            background: index % 2 === 0 ? "#ffffff" : "#f9fafb",
                            borderBottom: "1px solid #e5e7eb",
                            transition: "background-color 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                          onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#ffffff" : "#f9fafb"}
                        >
                          <td style={{ verticalAlign: "top", padding: "16px" }}>
                            <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>{penalty.penalty ? translateViolationType(penalty.penalty.violationType) : "Phạt"}</div>
                            {editingPenaltyId === penalty.rentalPenaltyId ? (
                              <textarea
                                value={editingPenaltyDescription}
                                onChange={(e) => setEditingPenaltyDescription(e.target.value)}
                                placeholder="Mô tả chi tiết..."
                                rows={2}
                                style={{ width: "100%", padding: "8px 12px", fontSize: "13px", marginTop: "8px", resize: "vertical", border: "1px solid #d1d5db", borderRadius: "6px", fontFamily: "inherit" }}
                                disabled={penaltySubmitting}
                              />
                            ) : (
                              <div style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px", lineHeight: "1.5" }}>{penalty.description}</div>
                            )}
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "top", padding: "16px" }}>
                            {editingPenaltyId === penalty.rentalPenaltyId ? (
                              <input
                                type="number"
                                min={0}
                                value={editingPenaltyAmount}
                                onChange={(e) => setEditingPenaltyAmount(Number(e.target.value))}
                                style={{ width: "120px", padding: "8px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "6px", textAlign: "center", fontFamily: "inherit" }}
                                disabled={penaltySubmitting}
                              />
                            ) : (
                              <span style={{ fontWeight: "600", color: "#1f2937" }}>{formatPrice(penalty.amount)}</span>
                            )}
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "top", padding: "16px" }}>
                            <span style={{ color: "#f59e0b", fontWeight: "500" }}>{formatPrice(penalty.depositUsedAmount)}</span>
                          </td>
                          <td style={{ textAlign: "center", verticalAlign: "top", padding: "16px" }}>
                            <span style={{ color: "#059669", fontWeight: "500" }}>{formatPrice(penalty.paidAmount)}</span>
                          </td>
                          <td style={{ verticalAlign: "top", padding: "16px" }}>
                            <span className={`status-badge ${getStatusBadgeClass(penalty.status)}`}>
                              {translatePenaltyStatus(penalty.status)}
                            </span>
                          </td>
                          <td style={{ verticalAlign: "top", padding: "16px" }}>
                            {editingPenaltyId === penalty.rentalPenaltyId ? (
                              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                                <button
                                  type="button"
                                  className="btn btn--sm btn--success"
                                  onClick={() => handleUpdatePenalty(penalty.rentalPenaltyId)}
                                  disabled={penaltySubmitting || editingPenaltyAmount <= 0}
                                  style={{ 
                                    padding: "6px 12px", 
                                    fontSize: "12px", 
                                    borderRadius: "6px",
                                    fontWeight: "500",
                                    transition: "all 0.2s ease"
                                  }}
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--sm btn--secondary"
                                  onClick={handleCancelEdit}
                                  disabled={penaltySubmitting}
                                  style={{ 
                                    padding: "6px 12px", 
                                    fontSize: "12px", 
                                    borderRadius: "6px",
                                    fontWeight: "500",
                                    transition: "all 0.2s ease"
                                  }}
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                                {remaining > 0 ? (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn--sm btn--warning"
                                      onClick={() => handleSettlePenalty(penalty.rentalPenaltyId, "deposit", remaining)}
                                      disabled={penaltySubmitting}
                                      style={{ 
                                        padding: "6px 12px", 
                                        fontSize: "12px", 
                                        borderRadius: "6px",
                                        fontWeight: "500",
                                        transition: "all 0.2s ease"
                                      }}
                                    >
                                      Trừ cọc
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn--sm btn--success"
                                      onClick={() => handleSettlePenalty(penalty.rentalPenaltyId, "cash", remaining)}
                                      disabled={penaltySubmitting}
                                      style={{ 
                                        padding: "6px 12px", 
                                        fontSize: "12px", 
                                        borderRadius: "6px",
                                        fontWeight: "500",
                                        transition: "all 0.2s ease"
                                      }}
                                    >
                                      Đã thu tiền
                                    </button>
                                  </>
                                ) : (
                                  <span style={{ color: "#059669", fontWeight: "500", fontSize: "13px" }}>Đã hoàn tất</span>
                                )}
                                {(penalty.status === "Pending" || penalty.status === "OffsetFromDeposit") && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn btn--sm btn--primary"
                                      onClick={() => handleEditPenalty(penalty)}
                                      disabled={penaltySubmitting}
                                      style={{ 
                                        padding: "6px 12px", 
                                        fontSize: "12px", 
                                        borderRadius: "6px",
                                        fontWeight: "500",
                                        transition: "all 0.2s ease"
                                      }}
                                    >
                                      Sửa
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn--sm btn--danger"
                                      onClick={() => handleDeletePenalty(penalty.rentalPenaltyId)}
                                      disabled={penaltySubmitting}
                                      style={{ 
                                        padding: "6px 12px", 
                                        fontSize: "12px", 
                                        borderRadius: "6px",
                                        fontWeight: "500",
                                        transition: "all 0.2s ease"
                                      }}
                                    >
                                      Xóa
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="penalty-form" style={{ marginTop: "16px" }}>
              <div className="form-group">
                <label>Loại phạt</label>
                <select value={selectedPenaltyId} onChange={(e) => handlePenaltyTypeChange(e.target.value)}>
                  <option value="">-- Chọn loại phạt --</option>
                  {penaltyCatalog.map((penalty) => (
                    <option key={penalty.penaltyId} value={penalty.penaltyId}>
                      {translateViolationType(penalty.violationType)} ({formatPrice(penalty.amount)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Số tiền phạt</label>
                <input
                  type="number"
                  min={0}
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={penaltyDescription}
                  onChange={(e) => setPenaltyDescription(e.target.value)}
                  placeholder="Mô tả chi tiết thiệt hại..."
                />
              </div>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={useDepositForPenalty}
                    onChange={(e) => setUseDepositForPenalty(e.target.checked)}
                    style={{ 
                      width: "18px", 
                      height: "18px", 
                      cursor: "pointer",
                      margin: 0,
                      flexShrink: 0
                    }}
                  />
                  <span>Ưu tiên trừ vào cọc nếu còn</span>
                </label>
              </div>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleCreatePenalty}
                disabled={penaltySubmitting || !selectedPenaltyId || penaltyAmount <= 0}
              >
                {penaltySubmitting ? "Đang xử lý..." : "Thêm khoản phạt"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {modalType === "detail" && selectedRental && (
        <Modal
          title="Chi tiết đơn thuê"
          onClose={closeModal}
          onSubmit={null}
          submitting={false}
          error={null}
        >
          <div className="modal-rental-info">
            <div className="info-grid">
              <div className="info-item">
                <strong>Mã đơn:</strong>
                <span>{selectedRental.rentalId}</span>
              </div>
              <div className="info-item">
                <strong>Khách hàng:</strong>
                <span>{selectedRental.userName || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Xe:</strong>
                <span>{selectedRental.vehicleName || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Trạm lấy:</strong>
                <span>{selectedRental.pickupStationName || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Trạm trả:</strong>
                <span>{selectedRental.returnStationName || "N/A"}</span>
              </div>
              <div className="info-item">
                <strong>Thời gian bắt đầu:</strong>
                <span>{formatDate(selectedRental.startTime)}</span>
              </div>
              <div className="info-item">
                <strong>Thời gian kết thúc:</strong>
                <span>{formatDate(selectedRental.endTime)}</span>
              </div>
              <div className="info-item">
                <strong>Tổng tiền:</strong>
                <span>{formatPrice(selectedRental.totalCost)}</span>
              </div>
              <div className="info-item">
                <strong>Trạng thái:</strong>
                <span className={`status-badge ${getStatusBadgeClass(selectedRental.status)}`}>
                  {getStatusLabel(selectedRental.status)}
                </span>
              </div>
              {(() => {
                const paymentStatus = getPaymentStatus(selectedRental);
                return (
                  <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                    <strong>Trạng thái thanh toán:</strong>
                    <div style={{ 
                      marginTop: "8px", 
                      padding: "12px", 
                      borderRadius: "8px",
                      background: paymentStatus.type === "deposit_only" ? "#fef3c7" : paymentStatus.type === "full" ? "#d1fae5" : "#f3f4f6",
                      border: `2px solid ${paymentStatus.color}`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: paymentStatus.type === "deposit_only" ? "8px" : "0" }}>
                        <span style={{ color: paymentStatus.color, fontWeight: "600", fontSize: "16px" }}>
                          {paymentStatus.label}
                        </span>
                      </div>
                      {paymentStatus.type === "deposit_only" && (
                        <div style={{ fontSize: "14px", marginTop: "8px" }}>
                          <p style={{ margin: "4px 0" }}>
                            <strong>Tiền thuê xe:</strong> {formatPrice(paymentStatus.rentalCost)}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <strong>Đã trả cọc:</strong> {formatPrice(paymentStatus.depositAmount)}
                          </p>
                          <p style={{ margin: "4px 0", color: "#dc2626", fontWeight: "600" }}>
                            <strong>⚠️ Còn phải thanh toán khi nhận xe:</strong> {formatPrice(paymentStatus.remaining)} (tiền thuê xe)
                          </p>
                        </div>
                      )}
                      {paymentStatus.type === "full" && (
                        <p style={{ margin: "4px 0", fontSize: "14px", color: "#059669" }}>
                          ✓ Khách hàng đã thanh toán đủ số tiền
                        </p>
                      )}
                      {selectedRental.deposit && (
                        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
                          <p style={{ margin: "4px 0", fontSize: "13px" }}>
                            <strong>Tiền cọc đã nộp:</strong> {formatPrice(selectedRental.deposit.amount)}
                          </p>
                          <p style={{ margin: "4px 0", fontSize: "13px" }}>
                            <strong>Đã sử dụng:</strong> {formatPrice(selectedRental.deposit.usedAmount)}
                          </p>
                          <p style={{ margin: "4px 0", fontSize: "13px" }}>
                            <strong>Còn lại:</strong> {formatPrice(selectedRental.deposit.availableAmount)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Contract Section */}
          {selectedRental.contract && (
            <div className="modal-contract-section" style={{ marginTop: "20px", padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "8px" }}>
              <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "600" }}>Thông tin hợp đồng</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Mã hợp đồng:</strong>
                  <span>{selectedRental.contract.contractId.substring(0, 8)}...</span>
                </div>
                <div className="info-item">
                  <strong>Ngày bắt đầu:</strong>
                  <span>{formatDate(selectedRental.contract.startDate)}</span>
                </div>
                <div className="info-item">
                  <strong>Ngày kết thúc:</strong>
                  <span>{selectedRental.contract.endDate ? formatDate(selectedRental.contract.endDate) : "N/A"}</span>
                </div>
                <div className="info-item">
                  <strong>Tổng tiền:</strong>
                  <span>{formatPrice(selectedRental.contract.totalAmount)}</span>
                </div>
                <div className="info-item">
                  <strong>Trạng thái hợp đồng:</strong>
                  <span className={`status-badge ${(selectedRental.contract.status?.toUpperCase() === "ACTIVE") ? "status-available" : "status-unknown"}`}>
                    {selectedRental.contract.status?.toUpperCase() === "ACTIVE" ? "Đang hiệu lực" : selectedRental.contract.status || "N/A"}
                  </span>
                </div>
                {selectedRental.contract.terms && (
                  <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                    <strong>Điều khoản:</strong>
                    <div style={{ marginTop: "8px", padding: "12px", backgroundColor: "white", borderRadius: "4px", whiteSpace: "pre-wrap" }}>
                      {selectedRental.contract.terms}
                    </div>
                  </div>
                )}
                {selectedRental.contract.createdAt && (
                  <div className="info-item">
                    <strong>Ngày tạo:</strong>
                    <span>{formatDate(selectedRental.contract.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="modal-feedback-section" style={{ marginTop: "20px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "18px", fontWeight: 600 }}>Đánh giá</h3>
            {loadingFeedbacks ? (
              <div className="text-center">Đang tải đánh giá...</div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center" style={{ color: "#666" }}>Chưa có đánh giá.</div>
            ) : (
              <div className="feedback-list" style={{ display: "grid", gap: "10px" }}>
                {feedbacks.map((fb) => (
                  <div key={fb.feedbackId} className="feedback-item" style={{ border: "1px solid #eee", borderRadius: 8, padding: 12, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong>Đánh giá: {fb.rating ?? "-"}/5</strong>
                      {fb.createdAt && <span style={{ color: "#999", fontSize: 12 }}>{formatDate(fb.createdAt)}</span>}
                    </div>
                    {fb.comment && <div style={{ whiteSpace: "pre-wrap" }}>{fb.comment}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-images-section">
            <h3>Ảnh bàn giao/nhận xe</h3>
            {loadingImages ? (
              <div className="text-center">Đang tải ảnh...</div>
            ) : rentalImages.length === 0 ? (
              <div className="text-center">Chưa có ảnh nào.</div>
            ) : (
              <div className="images-grid">
                {rentalImages.map((img) => (
                  <div key={img.imageId} className="image-card">
                    <img src={img.imageUrl} alt={img.type} />
                    <div className="image-info">
                      <div><strong>Loại:</strong> {getImageTypeLabel(img.type)}</div>
                      {img.description && <div><strong>Mô tả:</strong> {img.description}</div>}
                      {img.note && <div><strong>Ghi chú:</strong> {img.note}</div>}
                      {img.createdAt && (
                        <div><strong>Ngày:</strong> {formatDate(img.createdAt)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// Modal Component
interface ModalProps {
  title: string;
  onClose: () => void;
  onSubmit: ((e: React.FormEvent) => void) | null;
  submitting: boolean;
  error: string | null;
  children: React.ReactNode;
}

function Modal({ title, onClose, onSubmit, submitting, error, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={onSubmit || undefined}>
          {children}
          {onSubmit && (
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn--secondary" disabled={submitting}>
                Hủy
              </button>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          )}
          {!onSubmit && (
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn--primary">
                Đóng
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
