import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useNotification } from '../../context/NotificationContext';
import { useTranslation, useLanguage } from '../../context/LanguageContext';
import { requestService } from '../../services/requestService';
import { Conversation, ChatMessage } from '../../types/chat';
import { formatDateTime } from '../../utils/formatters';
import { translateCrop, translateVariety, translateUserName } from '../../utils/cropTranslations';
import {
  MessageSquare,
  Send,
  User,
  ArrowLeft,
  ShoppingBag,
  Package,
  Award,
  CheckCheck,
  Check,
  RefreshCw,
  Search,
  Sparkles,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Tag,
  PlusCircle,
  Info,
  Filter,
  Trash2,
} from 'lucide-react';

const DECLINE_REASONS = [
  'Price is too low',
  'Distance is too far',
  'Quantity is not suitable',
  'Product is no longer available',
  'Delivery/logistics issue',
  'Other',
];

export const ChatPage: React.FC = () => {
  const { user, role } = useAuth();
  const { showToast } = useNotification();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const convIdParam = searchParams.get('convId');

  const {
    isConnected,
    conversations,
    activeConversation,
    messages,
    isOtherTyping,
    selectConversation,
    sendMessage,
    sendTyping,
    refreshConversations,
    deleteConversation,
    loadOlderMessages,
    hasMoreOlderMessages,
    isLoadingOlder,
    updatePurchaseRequestStatus,
  } = useChat();

  const [inputText, setInputText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('ALL');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState<boolean>(false);
  const [newUnreadCount, setNewUnreadCount] = useState<number>(0);
  const [userIsReadingHistory, setUserIsReadingHistory] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Delete Conversation Modal State
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);

  // Decline Modal State
  const [declineTargetId, setDeclineTargetId] = useState<number | null>(null);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState<string>(DECLINE_REASONS[0]);
  const [customDeclineReason, setCustomDeclineReason] = useState<string>('');

  // Farmer Sell Offer Modal State
  const [showSellOfferModal, setShowSellOfferModal] = useState<boolean>(false);
  const [offerQuantity, setOfferQuantity] = useState<string>('100');
  const [offerPrice, setOfferPrice] = useState<string>('25');
  const [offerMessage, setOfferMessage] = useState<string>('Special direct offer for fast delivery.');

  // Listing Context Modal State
  const [showListingModal, setShowListingModal] = useState<boolean>(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const isPrependingRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(0);

  const isFarmer = role === 'FARMER';

  // Extract all distinct crops discussed in the active conversation
  const availableCrops = React.useMemo(() => {
    const crops = new Set<string>();
    if (activeConversation?.cropName) crops.add(activeConversation.cropName);
    messages.forEach((m) => {
      if (m.purchaseRequestDetails?.cropName) crops.add(m.purchaseRequestDetails.cropName);
      if (m.messageText) {
        if (m.messageText.includes('Bottle Gourd')) crops.add('Bottle Gourd');
        if (m.messageText.includes('Banana')) crops.add('Banana');
        if (m.messageText.includes('Onion')) crops.add('Onion');
        if (m.messageText.includes('Mango')) crops.add('Mango');
      }
    });
    return Array.from(crops);
  }, [activeConversation, messages]);

  // Filter messages by selected crop tag if active
  const filteredMessages = React.useMemo(() => {
    if (selectedCropFilter === 'ALL') return messages;
    return messages.filter((m) => {
      const txt = (m.messageText || '').toLowerCase();
      const crop = (m.purchaseRequestDetails?.cropName || '').toLowerCase();
      const target = selectedCropFilter.toLowerCase();
      return crop.includes(target) || txt.includes(target);
    });
  }, [messages, selectedCropFilter]);

  // Check if scroll container is near bottom (threshold 150px)
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 150;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
    setNewUnreadCount(0);
    setUserIsReadingHistory(false);
  }, []);

  useEffect(() => {
    if (convIdParam) {
      const cid = parseInt(convIdParam, 10);
      if (!isNaN(cid)) {
        selectConversation(cid);
      }
    } else if (conversations.length > 0 && !activeConversation) {
      selectConversation(conversations[0].id);
    }
  }, [convIdParam, conversations.length]);

  // Initial scroll to bottom when opening a conversation
  useLayoutEffect(() => {
    if (activeConversation) {
      setNewUnreadCount(0);
      setUserIsReadingHistory(false);
      isPrependingRef.current = false;
      prevMessagesLengthRef.current = messages.length;
      setSelectedCropFilter('ALL');

      requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
    }
  }, [activeConversation?.id, scrollToBottom]);

  // Preserve exact scroll position when older messages are loaded into the DOM
  useLayoutEffect(() => {
    if (isPrependingRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      container.scrollTop = newScrollHeight - prevScrollHeightRef.current + prevScrollTopRef.current;
      isPrependingRef.current = false;
    }
  }, [messages.length]);

  // Smart Auto-Scroll on new incoming/outgoing messages
  useEffect(() => {
    const prevLen = prevMessagesLengthRef.current;
    const newLen = messages.length;
    prevMessagesLengthRef.current = newLen;

    if (newLen > prevLen && !isPrependingRef.current) {
      const nearBottom = isNearBottom();
      const lastMsg = messages[messages.length - 1];
      const isSelf = lastMsg?.senderId === user?.id;

      if (isSelf || nearBottom) {
        scrollToBottom('smooth');
      } else {
        setNewUnreadCount((prev) => prev + 1);
        setUserIsReadingHistory(true);
      }
    }
  }, [messages, isNearBottom, scrollToBottom, user?.id]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight } = container;

    if (isNearBottom()) {
      setNewUnreadCount(0);
      setUserIsReadingHistory(false);
    } else {
      setUserIsReadingHistory(true);
    }

    if (scrollTop <= 10 && hasMoreOlderMessages && !isLoadingOlder && messages.length > 0) {
      isPrependingRef.current = true;
      prevScrollHeightRef.current = scrollHeight;
      prevScrollTopRef.current = scrollTop;
      loadOlderMessages();
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    selectConversation(conv.id);
    setIsMobileChatOpen(true);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    const text = inputText.trim();
    setInputText('');
    sendTyping(false);

    try {
      await sendMessage(text);
      scrollToBottom('smooth');
    } catch (err: any) {
      showToast(err.message || 'Failed to send message.', 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshConversations();
      if (activeConversation) {
        await selectConversation(activeConversation.id);
      }
      showToast('Chat refreshed successfully!', 'success');
    } catch (err: any) {
      showToast('Failed to refresh chat.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmDeleteConversation = async () => {
    if (!activeConversation) return;
    try {
      await deleteConversation(activeConversation.id);
      setShowDeleteConfirmModal(false);
      showToast(isTa ? 'உரையாடல் வெற்றிகரமாக நீக்கப்பட்டது.' : 'Conversation deleted successfully.', 'info');
    } catch (err: any) {
      showToast(err.message || (isTa ? 'உரையாடலை நீக்குவதில் தோல்வி.' : 'Failed to delete conversation.'), 'error');
    }
  };

  const handleAcceptPurchaseRequest = async (requestId: number) => {
    setActionLoadingId(requestId);
    try {
      await requestService.acceptRequest(requestId);
      updatePurchaseRequestStatus(requestId, 'ACCEPTED');
      showToast(isTa ? 'கொள்முதல் கோரிக்கை ஏற்றுக்கொள்ளப்பட்டது! வர்த்தக ஆர்டர் உருவாக்கப்பட்டது.' : 'Purchase request accepted successfully! Trade order generated.', 'success');
      await refreshConversations();
    } catch (err: any) {
      showToast(err.message || (isTa ? 'கோரிக்கையை ஏற்றுக்கொள்வதில் தோல்வி.' : 'Failed to accept purchase request.'), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDecline = async () => {
    if (!declineTargetId) return;

    const reason = selectedDeclineReason === 'Other' ? (customDeclineReason.trim() || (isTa ? 'விற்பனையாளரால் நிராகரிக்கப்பட்டது' : 'Declined by seller')) : selectedDeclineReason;
    setActionLoadingId(declineTargetId);

    try {
      await requestService.declineRequest(declineTargetId, reason);
      updatePurchaseRequestStatus(declineTargetId, 'DECLINED', reason);
      showToast(isTa ? `கொள்முதல் கோரிக்கை நிராகரிக்கப்பட்டது. காரணம்: ${reason}` : `Purchase request declined. Reason: ${reason}`, 'info');
      setDeclineTargetId(null);
      setCustomDeclineReason('');
      await refreshConversations();
    } catch (err: any) {
      showToast(err.message || (isTa ? 'கோரிக்கையை நிராகரிப்பதில் தோல்வி.' : 'Failed to decline request.'), 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendFarmerSellOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation) return;

    const qty = parseFloat(offerQuantity);
    const price = parseFloat(offerPrice);

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      showToast(isTa ? 'சரியான அளவு மற்றும் விலையை உள்ளிடவும்.' : 'Please enter valid quantity and price.', 'error');
      return;
    }

    try {
      const offerText = `FARMER SELL OFFER\nOffer for ${qty} KG ${activeConversation.cropName || 'Produce'} at ₹${price}/KG.\nNotes: ${offerMessage}`;
      await sendMessage(offerText);
      setShowSellOfferModal(false);
      showToast(isTa ? 'விற்பனை சலுகை வெற்றிகரமாக அனுப்பப்பட்டது!' : 'Sell offer sent to buyer successfully!', 'success');
      scrollToBottom('smooth');
    } catch (err: any) {
      showToast(err.message || (isTa ? 'விற்பனை சலுகையை அனுப்புவதில் தோல்வி.' : 'Failed to send sell offer.'), 'error');
    }
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] min-h-0 flex flex-col bg-[#F4F7F4] overflow-hidden max-w-7xl mx-auto rounded-2xl shadow-sm border border-[#C5E6CC]/80 my-1">
      <div className="px-4 py-2.5 bg-white border-b border-[#C5E6CC] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-[#1B5E20]">{isTa ? 'நிகழ்நேர B2B வர்த்தக உரையாடல்' : 'Real-Time B2B Trade Chat'}</h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isConnected ? (isTa ? 'நேரடி தொடர்பு' : 'Live WebSocket') : (isTa ? 'மீண்டும் இணைக்கிறது...' : 'Reconnecting...')}
            </span>
          </div>
          <p className="text-[11px] text-[#526158] font-medium hidden sm:block">
            {isTa ? 'பயிர்கள், விலைகள் மற்றும் கொள்முதல் கோரிக்கைகளை விவாதிக்க விவசாயிகளுடன் நேரடியாகத் தொடர்பு கொள்ளுங்கள்.' : 'Communicate directly with verified farmers/buyers to discuss products, pricing, logistics and purchase requests.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeConversation && (
            <button
              onClick={() => setShowDeleteConfirmModal(true)}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" /> {isTa ? 'அரட்டையை நீக்கு' : 'Delete Chat'}
            </button>
          )}

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-[#1B5E20] bg-[#EEF8F0] hover:bg-[#DDF2E1] border border-[#C5E6CC] rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> {isTa ? 'புதுப்பி' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
        <div className={`md:col-span-4 border-r border-[#C5E6CC] bg-white flex flex-col min-h-0 h-full ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-[#C5E6CC] bg-[#FCFBF5] shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-[#526158] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={isTa ? 'பங்குதாரர், பயிர் தேடுக...' : 'Search partner, crop, or variety...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#C5E6CC] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-[#C5E6CC]/40">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-[#526158] text-xs">
                {isTa ? 'உரையாடல்கள் எதுவும் இல்லை.' : 'No active conversations found.'}
              </div>
            ) : (
              conversations.map((c) => {
                const rawPartner = isFarmer ? c.participantBuyerName : c.participantFarmerName;
                const partnerName = translateUserName(rawPartner, language);
                return (
                  <button key={c.id} onClick={() => handleSelectConversation(c)} className="w-full text-left p-3.5 hover:bg-[#FCFBF5] transition-colors">
                    <span className="font-extrabold text-xs text-[#17201A]">{partnerName}</span>
                    <p className="text-[11px] text-[#526158] truncate">{c.lastMessageText || (isTa ? 'அரட்டையைத் தொடங்கு...' : 'Tap to chat...')}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className={`md:col-span-8 flex flex-col min-h-0 h-full bg-white relative ${isMobileChatOpen ? 'flex' : 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
              {/* CHAT HEADER & CONTEXT BANNER */}
              <div className="p-3.5 sm:p-4 border-b border-[#C5E6CC] bg-white shadow-2xs z-10 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setIsMobileChatOpen(false)}
                      className="md:hidden p-1.5 text-[#526158] hover:text-[#17201A]"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-9 h-9 bg-[#1B5E20] text-white rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {translateUserName(isFarmer ? activeConversation.participantBuyerName : activeConversation.participantFarmerName, language).charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#17201A] truncate">
                        {isFarmer ? activeConversation.participantBuyerName : activeConversation.participantFarmerName}
                      </h3>
                      <p className="text-[11px] text-[#2E7D32] font-semibold flex items-center gap-1 truncate">
                        <span>{activeConversation.cropName} {activeConversation.varietyName ? `(${activeConversation.varietyName})` : ''}</span>
                        <span>•</span>
                        <span>{activeConversation.qualityGrade || 'GRADE A PREMIUM'}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowListingModal(true)}
                    className="px-3 py-1.5 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-[#2E7D32]" /> {isTa ? 'பட்டியல் விவரங்களைக் காண்க' : 'View Listing Context'}
                  </button>
                </div>
              </div>

              {/* MESSAGES LIST SCROLL CONTAINER */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 bg-[#FAFDFB] min-h-0"
              >
                {messages.map((m, index) => {
                  const isSelf = m.senderId === user?.id;
                  const isPurchaseRequestCard =
                    m.messageType === 'PURCHASE_REQUEST' ||
                    (m.messageText && m.messageText.includes('PURCHASE REQUEST'));
                  const isFarmerSellOfferCard =
                    m.messageType === 'FARMER_SELL_OFFER' ||
                    (m.messageText && m.messageText.includes('FARMER SELL OFFER'));

                  let effectiveStatus = m.purchaseRequestDetails?.status || 'PENDING';
                  const subsequentText = messages.slice(index + 1).map((msg) => msg.messageText || '').join(' ');
                  if (subsequentText.includes('Purchase request accepted') || subsequentText.includes('Status: ACCEPTED') || (m.messageText && m.messageText.includes('Status: ACCEPTED'))) {
                    effectiveStatus = 'ACCEPTED';
                  } else if (subsequentText.includes('Purchase request declined') || subsequentText.includes('Status: DECLINED') || (m.messageText && m.messageText.includes('Status: DECLINED'))) {
                    effectiveStatus = 'DECLINED';
                  }

                  if (isPurchaseRequestCard || isFarmerSellOfferCard) {
                    return (
                      <div key={m.clientMessageId || m.messagePublicId || m.id} className="flex justify-center my-2">
                        <div className="w-full max-w-md bg-white border-2 border-[#2E7D32]/30 rounded-3xl p-4 shadow-sm space-y-3">
                          <div className="flex items-center justify-between border-b border-[#C5E6CC]/60 pb-2">
                            <div className="flex items-center gap-1.5">
                              <ShoppingBag className="w-4 h-4 text-[#2E7D32]" />
                              <span className="text-xs font-extrabold text-[#1B5E20] uppercase tracking-wider">
                                {isFarmerSellOfferCard ? (isTa ? 'விவசாயி விற்பனை சலுகை' : 'Farmer Sell Offer') : (isTa ? 'B2B கொள்முதல் கோரிக்கை' : 'B2B Purchase Request')}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                effectiveStatus === 'ACCEPTED'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : effectiveStatus === 'DECLINED' || effectiveStatus === 'REJECTED'
                                  ? 'bg-red-100 text-red-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {effectiveStatus}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            <p className="font-extrabold text-sm text-[#17201A]">
                              {m.purchaseRequestDetails?.cropName || activeConversation.cropName} {activeConversation.varietyName ? `– ${activeConversation.varietyName}` : ''}
                            </p>
                            <p className="text-[11px] text-[#526158] whitespace-pre-wrap break-words">{m.messageText}</p>
                          </div>

                          {effectiveStatus === 'PENDING' && (
                            <div className="flex items-center gap-2 pt-1 border-t border-[#C5E6CC]/40">
                              {isFarmer && isPurchaseRequestCard && (
                                <>
                                  <button
                                    onClick={() => handleAcceptPurchaseRequest(m.purchaseRequestId || activeConversation.listingId || 1)}
                                    disabled={actionLoadingId !== null}
                                    className="flex-1 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-extrabold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> {isTa ? 'கோரிக்கையை ஏற்றுக்கொள்' : 'Accept Request'}
                                  </button>
                                  <button
                                    onClick={() => setDeclineTargetId(m.purchaseRequestId || activeConversation.listingId || 1)}
                                    disabled={actionLoadingId !== null}
                                    className="flex-1 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 font-extrabold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> {isTa ? 'நிராகரி' : 'Decline'}
                                  </button>
                                </>
                              )}

                              {!isFarmer && isFarmerSellOfferCard && (
                                <>
                                  <button
                                    onClick={() => handleAcceptPurchaseRequest(m.purchaseRequestId || activeConversation.listingId || 1)}
                                    disabled={actionLoadingId !== null}
                                    className="flex-1 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-extrabold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> {isTa ? 'சலுகையை ஏற்றுக்கொள்' : 'Accept Offer'}
                                  </button>
                                  <button
                                    onClick={() => setDeclineTargetId(m.purchaseRequestId || activeConversation.listingId || 1)}
                                    disabled={actionLoadingId !== null}
                                    className="flex-1 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 font-extrabold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> {isTa ? 'நிராகரி' : 'Decline'}
                                  </button>
                                </>
                              )}

                              {!isFarmer && isPurchaseRequestCard && (
                                <div className="w-full text-[11px] text-[#526158] font-bold bg-[#EEF8F0] p-2 rounded-xl text-center border border-[#C5E6CC]">
                                  {isTa ? 'விவசாயி பதிலுக்காக காத்திருக்கிறது...' : 'Waiting for farmer response...'}
                                </div>
                              )}

                              {isFarmer && isFarmerSellOfferCard && (
                                <div className="w-full text-[11px] text-[#526158] font-bold bg-[#EEF8F0] p-2 rounded-xl text-center border border-[#C5E6CC]">
                                  {isTa ? 'வாங்குபவருக்கு சலுகை அனுப்பப்பட்டது. பதிலுக்காக காத்திருக்கிறது...' : 'Sent offer to buyer. Waiting for response...'}
                                </div>
                              )}
                            </div>
                          )}

                          {effectiveStatus === 'ACCEPTED' && (
                            <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 p-2 rounded-xl text-center border border-emerald-200 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {isTa ? 'கோரிக்கை ஏற்றுக்கொள்ளப்பட்டு வர்த்தக ஆர்டர் உருவாக்கப்பட்டது' : 'Request Accepted & Trade Order Generated'}
                            </div>
                          )}

                          {(effectiveStatus === 'DECLINED' || effectiveStatus === 'REJECTED') && (
                            <div className="text-[11px] font-bold text-red-800 bg-red-50 p-2 rounded-xl text-center border border-red-200 flex items-center justify-center gap-1.5">
                              <XCircle className="w-4 h-4 text-red-600" /> {isTa ? 'கோரிக்கை நிராகரிக்கப்பட்டது' : 'Request Declined'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.clientMessageId || m.messagePublicId || m.id}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          isSelf
                            ? 'bg-[#2E7D32] text-white rounded-tr-none font-medium'
                            : 'bg-[#FCFBF5] border border-[#C5E6CC] text-[#17201A] rounded-tl-none font-medium'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.messageText}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-75">
                          <span>{formatDateTime(m.sentAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isOtherTyping && (
                  <div className="flex items-center gap-2 text-xs text-[#2E7D32] font-semibold italic bg-[#EEF8F0] p-2 rounded-xl border border-[#C5E6CC] w-fit">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" /> Partner is typing a message...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* FLOATING "NEW MESSAGES" BADGE */}
              {userIsReadingHistory && newUnreadCount > 0 && (
                <button
                  onClick={() => scrollToBottom('smooth')}
                  className="absolute bottom-16 right-6 bg-[#2E7D32] text-white font-bold text-xs px-3.5 py-2 rounded-full shadow-lg hover:bg-[#1B5E20] flex items-center gap-1.5 transition-all animate-bounce z-20 cursor-pointer"
                >
                  <span>{newUnreadCount} new message{newUnreadCount > 1 ? 's' : ''}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}

              {/* INPUT COMPOSER */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-[#C5E6CC] bg-white flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-[#2E7D32] text-white rounded-2xl hover:bg-[#1B5E20] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-[#526158] text-xs">
              Select a conversation from the sidebar to view message history.
            </div>
          )}
        </div>

      </div>

      {/* DECLINE REASON MODAL */}
      {declineTargetId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
              <h3 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" /> Why are you declining this request?
              </h3>
              <button onClick={() => setDeclineTargetId(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {DECLINE_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedDeclineReason === reason
                      ? 'bg-[#EEF8F0] border-[#2E7D32] font-bold text-[#1B5E20]'
                      : 'bg-white border-gray-200 text-[#17201A] hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="declineReason"
                    value={reason}
                    checked={selectedDeclineReason === reason}
                    onChange={() => setSelectedDeclineReason(reason)}
                    className="accent-[#2E7D32]"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              {selectedDeclineReason === 'Other' && (
                <textarea
                  placeholder="Provide specific explanation for declining..."
                  value={customDeclineReason}
                  onChange={(e) => setCustomDeclineReason(e.target.value)}
                  className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none mt-2"
                  rows={2}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C5E6CC]">
              <button
                onClick={() => setDeclineTargetId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecline}
                disabled={actionLoadingId !== null}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FARMER SELL OFFER MODAL */}
      {showSellOfferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
              <h3 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#2E7D32]" /> Send Direct Sell Offer to Buyer
              </h3>
              <button onClick={() => setShowSellOfferModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendFarmerSellOffer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#17201A] mb-1">Crop / Product Context</label>
                <div className="p-2.5 bg-[#EEF8F0] border border-[#C5E6CC] rounded-xl font-bold text-[#1B5E20]">
                  {activeConversation?.cropName || 'Produce'} {activeConversation?.varietyName ? `(${activeConversation?.varietyName})` : ''}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17201A] mb-1">Quantity (KG)</label>
                  <input
                    type="number"
                    value={offerQuantity}
                    onChange={(e) => setOfferQuantity(e.target.value)}
                    className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold text-[#17201A] focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17201A] mb-1">Offered Price (₹/KG)</label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl font-bold text-[#17201A] focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17201A] mb-1">Delivery / Offer Notes</label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full p-2.5 bg-[#FCFBF5] border border-[#C5E6CC] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2E7D32] focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C5E6CC]">
                <button
                  type="button"
                  onClick={() => setShowSellOfferModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Send Sell Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTING CONTEXT MODAL */}
      {showListingModal && activeConversation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
              <h3 className="font-extrabold text-sm text-[#1B5E20] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#2E7D32]" /> Marketplace Listing Context
              </h3>
              <button onClick={() => setShowListingModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#EEF8F0] border border-[#C5E6CC] rounded-2xl space-y-1">
                <p className="text-sm font-extrabold text-[#17201A]">
                  {activeConversation.cropName} {activeConversation.varietyName ? `(${activeConversation.varietyName})` : ''}
                </p>
                <p className="text-[11px] text-[#2E7D32] font-bold">
                  Quality Grade: {activeConversation.qualityGrade || 'GRADE A PREMIUM'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="block text-[10px] text-[#526158] font-bold uppercase">Partner</span>
                  <span className="font-extrabold text-[#17201A] text-xs">
                    {isFarmer ? activeConversation.participantBuyerName : activeConversation.participantFarmerName}
                  </span>
                </div>
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="block text-[10px] text-[#526158] font-bold uppercase">Listing Status</span>
                  <span className="font-extrabold text-emerald-800 text-xs">ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#C5E6CC]">
              {activeConversation.listingId ? (
                <Link
                  to={`/buyer/listings/${activeConversation.listingId}`}
                  onClick={() => setShowListingModal(false)}
                  className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold text-xs rounded-xl shadow-xs text-center w-full"
                >
                  Open Full Marketplace Listing
                </Link>
              ) : (
                <button
                  onClick={() => setShowListingModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl w-full"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONVERSATION CONFIRMATION MODAL */}
      {showDeleteConfirmModal && activeConversation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#C5E6CC] rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3">
              <h3 className="font-extrabold text-sm text-red-700 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" /> Delete Chat Conversation
              </h3>
              <button onClick={() => setShowDeleteConfirmModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#17201A] font-medium leading-relaxed">
              Are you sure you want to delete this chat conversation with{' '}
              <span className="font-extrabold text-[#1B5E20]">
                {isFarmer ? activeConversation.participantBuyerName : activeConversation.participantFarmerName}
              </span>
              ? All message history will be permanently deleted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#C5E6CC]">
              <button
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteConversation}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Permanently Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
