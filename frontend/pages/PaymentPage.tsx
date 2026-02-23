import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { paymentApi } from '../services/api';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'payos' | 'transfer' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [transactionInfo, setTransactionContent] = useState<{ content: string; amount: number } | null>(null);

  const handlePayment = async () => {
    if (!selectedMethod) return;
    setLoading(true);
    
    try {
      if (selectedMethod === 'payos') {
        // Giả lập PayOS
        setTimeout(() => {
          setLoading(false);
          alert('Đang chuyển hướng đến cổng thanh toán PayOS...');
          navigate('/profile');
        }, 2000);
      } else {
        // Chuyển khoản ngân hàng - Gọi API xin PIN
        const amount = 95000;
        const res = await paymentApi.requestPin(null as any, amount, 'TRANSFER');
        setTransactionContent({
          content: res.transactionContent,
          amount: res.amount
        });
        setLoading(false);
        setShowQrModal(true);
      }
    } catch (err) {
      setLoading(false);
      alert(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    }
  };

  const handleConfirmTransfer = async () => {
    if (!transactionInfo) return;
    setLoading(true);
    try {
      const res = await paymentApi.confirmTransfer(null as any, transactionInfo.content);
      if (res.success) {
        alert('Đã gửi thông báo xác nhận. Vui lòng chờ admin kiểm tra!');
        setShowQrModal(false);
        navigate('/profile');
      } else {
        alert(res.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại Hồ sơ
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200 uppercase tracking-wider">
              VIP Upgrade
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden sticky top-8">
              <div className="p-6 bg-gradient-to-br from-primary-600 to-violet-700 text-white">
                <h3 className="text-xl font-bold mb-1">Gói VIP Pro</h3>
                <p className="text-primary-100 text-sm">Thời hạn: Vĩnh viễn</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-black">100.000</span>
                  <span className="text-lg font-medium opacity-80">VNĐ</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="mt-1 bg-green-100 text-green-600 p-0.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-neutral-600">Không giới hạn tạo câu hỏi AI</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="mt-1 bg-green-100 text-green-600 p-0.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-neutral-600">Mở khóa bộ sưu tập cá nhân</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="mt-1 bg-green-100 text-green-600 p-0.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-neutral-600">Xuất file PDF/Word chất lượng cao</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="mt-1 bg-green-100 text-green-600 p-0.5 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-neutral-600">Hỗ trợ ưu tiên 24/7</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-neutral-100 flex justify-between items-center text-sm font-bold text-neutral-800 uppercase tracking-tighter">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">100.000 VNĐ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-8">
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">Chọn phương thức thanh toán</h2>
              <p className="text-neutral-500 mb-8 text-sm">Vui lòng chọn một trong các phương thức thanh toán an toàn dưới đây.</p>

              <div className="space-y-4">
                {/* PayOS */}
                <div 
                  onClick={() => setSelectedMethod('payos')}
                  className={`group relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    selectedMethod === 'payos' ? 'border-primary-600 bg-primary-50/50 shadow-md' : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0 text-white font-black text-xs overflow-hidden relative">
                      <span className="group-hover:opacity-0 transition-opacity duration-300">PayOS</span>
                      <img 
                        src="https://about.cas.so/wp-content/uploads/sites/11/2023/08/cropped-Untitled-1.png" 
                        alt="PayOS"
                        className="absolute inset-0 w-full h-full object-contain p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-800">Thanh toán qua PayOS</p>
                      <p className="text-xs text-neutral-500">Hỗ trợ QR Code ngân hàng, thẻ nội địa và quốc tế</p>
                    </div>
                  </div>
                  {selectedMethod === 'payos' && (
                    <div className="bg-primary-600 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Bank Transfer */}
                <div 
                  onClick={() => setSelectedMethod('transfer')}
                  className={`group relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    selectedMethod === 'transfer' ? 'border-primary-600 bg-primary-50/50 shadow-md' : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs overflow-hidden relative">
                      <span className="group-hover:opacity-0 transition-opacity duration-300 uppercase">Bank</span>
                      <img 
                        src="/bank-transfer.png" 
                        alt="Bank"
                        className="absolute inset-0 w-full h-full object-contain p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-neutral-800">Chuyển khoản ngân hàng</p>
                      <p className="text-xs text-neutral-500">Xác nhận thủ công (Giảm thêm 5.000đ)</p>
                    </div>
                  </div>
                  {selectedMethod === 'transfer' && (
                    <div className="bg-primary-600 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10">
                <button
                  onClick={handlePayment}
                  disabled={!selectedMethod || loading}
                  className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all ${
                    !selectedMethod || loading
                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-primary-600 to-violet-700 text-white hover:shadow-primary-200/50 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Đang kết nối...</span>
                    </div>
                  ) : (
                    `Thanh toán ${selectedMethod === 'transfer' ? '95.000' : '100.000'} VNĐ`
                  )}
                </button>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-400 font-medium italic">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Giao dịch an toàn & bảo mật qua SSL
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Modal for Bank Transfer */}
      {showQrModal && transactionInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 bg-gradient-to-r from-primary-600 to-violet-700 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Chuyển khoản Ngân hàng</h3>
              <button 
                onClick={() => setShowQrModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8 text-center">
              <p className="text-neutral-500 text-sm mb-6">Quét mã QR dưới đây bằng ứng dụng ngân hàng của bạn</p>
              
              <div className="relative inline-block p-4 bg-white border-2 border-neutral-100 rounded-3xl shadow-inner mb-6 group">
                <img 
                  src="https://media-cdn-v2.laodong.vn/storage/newsportal/2021/6/15/920631/4128Nh_2021-06-15_Lu.jpeg" 
                  alt="QR Code" 
                  className="w-64 h-64 object-cover rounded-xl"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white p-2 rounded-lg shadow-lg text-[10px] font-bold text-primary-600 uppercase">Scan to Pay</div>
                </div>
              </div>

              <div className="space-y-4 text-left bg-neutral-50 p-5 rounded-2xl border border-neutral-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Số tiền</span>
                  <span className="text-lg font-black text-primary-600 tracking-tighter">{transactionInfo.amount.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-neutral-200/60">
                  <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">Nội dung chuyển khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-800 bg-amber-100 px-2 py-1 rounded border border-amber-200">{transactionInfo.content}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(transactionInfo.content);
                        alert('Đã sao chép nội dung chuyển khoản!');
                      }}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Sao chép"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-[11px] text-neutral-400 italic">
                * Sau khi chuyển khoản thành công, hệ thống sẽ tự động kích hoạt VIP trong vòng 5-10 phút. 
                Vui lòng nhập đúng nội dung chuyển khoản.
              </p>
            </div>

            <div className="p-6 pt-0">
              <button 
                onClick={handleConfirmTransfer}
                disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                Tôi đã chuyển khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
