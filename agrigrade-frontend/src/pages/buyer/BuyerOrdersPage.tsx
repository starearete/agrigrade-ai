import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/requestService';
import { useAuth } from '../../context/AuthContext';
import { Order } from '../../types/request';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { formatCurrency, formatQuantity, formatDate } from '../../utils/formatters';
import { Package, Truck, CheckCircle2, MapPin } from 'lucide-react';

export const BuyerOrdersPage: React.FC = () => {
  const { user, role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userRole = role === 'ADMIN' ? 'BUYER' : role;
      const data = await orderService.getOrders(user?.id, userRole || 'BUYER');
      setOrders(data);
    } catch (err: any) {
      console.error('Failed to load trade orders:', err);
      setError(err?.message || 'Failed to load trade orders from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user?.id, role]);

  if (isLoading) return <LoadingState message="Loading trade orders..." />;

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-xl mx-auto my-8 space-y-4">
        <h3 className="text-lg font-bold text-rose-800">Error Loading Trade Orders</h3>
        <p className="text-xs text-rose-600">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700"
        >
          Retry Request
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B5E20]">Agri B2B Trade Orders</h1>
        <p className="text-xs text-[#526158] mt-0.5">
          Agreed B2B trade contracts formed automatically upon purchase offer acceptance.
        </p>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No Active Trade Orders"
          description="Trade orders are formed automatically when purchase requests are accepted."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs">
              <div className="flex justify-between items-start border-b border-[#C5E6CC] pb-3 mb-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[#526158]">{order.orderNumber}</span>
                  <h4 className="font-extrabold text-base text-[#17201A]">
                    {order.cropName} ({order.varietyName})
                  </h4>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#FCFBF5] border border-[#C5E6CC] p-3 rounded-2xl text-xs">
                <div>
                  <span className="text-[#526158] block text-[11px]">Agreed Price</span>
                  <span className="font-bold text-[#1B5E20]">{formatCurrency(order.agreedPricePerUnit)} / KG</span>
                </div>
                <div>
                  <span className="text-[#526158] block text-[11px]">Quantity</span>
                  <span className="font-bold text-[#17201A]">{formatQuantity(order.quantity, order.quantityUnit)}</span>
                </div>
                <div>
                  <span className="text-[#526158] block text-[11px]">Total Contract</span>
                  <span className="font-extrabold text-[#1B5E20]">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-[#526158] block text-[11px]">Contract Date</span>
                  <span className="font-medium text-[#17201A]">{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
