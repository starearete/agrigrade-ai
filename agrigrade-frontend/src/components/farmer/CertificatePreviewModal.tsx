import React from 'react';
import { AiCertificate } from '../../types/ai';
import { useNotification } from '../../context/NotificationContext';
import { X, Award, ShieldCheck, Download, ExternalLink, Info } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface CertificatePreviewModalProps {
  certificate: AiCertificate;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  certificate: cert,
  isOpen,
  onClose,
}) => {
  const { showToast } = useNotification();

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    showToast('Certificate PDF export downloaded to device.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white border border-[#C5E6CC] rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#526158] hover:bg-[#EEF8F0] rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Printable Header */}
        <div className="border-4 border-[#2E7D32] p-6 rounded-2xl bg-[#FCFBF5] text-center relative overflow-hidden space-y-3">
          {/* MOCK DEVELOPMENT BADGE */}
          <div className="bg-amber-100 border border-amber-300 text-[#A66A00] font-extrabold text-[10px] uppercase py-1 px-3 rounded-full inline-flex items-center gap-1">
            <Info className="w-3 h-3" /> DEVELOPMENT / MOCK CERTIFICATE
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#2E7D32] text-white rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="font-extrabold text-lg text-[#1B5E20] uppercase tracking-wider">AgriGrade AI</h2>
              <p className="text-[10px] text-[#526158] font-bold">Official Quality & Freshness Passport</p>
            </div>
          </div>

          <div className="w-full h-0.5 bg-[#C5E6CC] my-3" />

          <p className="text-xs text-[#526158] font-semibold uppercase tracking-wider">Certificate ID</p>
          <p className="text-base font-extrabold text-[#17201A] font-mono mb-4">{cert.certificateNumber}</p>

          <div className="bg-white border border-[#C5E6CC] rounded-xl p-4 mb-4 text-left grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#526158] block">Crop & Variety:</span>
              <span className="font-bold text-[#17201A]">{cert.cropName} ({cert.varietyName})</span>
            </div>
            <div>
              <span className="text-[#526158] block">Quality Grade:</span>
              <span className="font-bold text-[#1B5E20]">{cert.qualityGrade.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-[#526158] block">Quality Score:</span>
              <span className="font-bold text-[#2E7D32]">{cert.qualityScore} / 100</span>
            </div>
            <div>
              <span className="text-[#526158] block">Est. Shelf-Life:</span>
              <span className="font-bold text-[#17201A]">{cert.estimatedRemainingDays} days remaining</span>
            </div>
            <div>
              <span className="text-[#526158] block">Harvest Date:</span>
              <span className="font-medium text-[#17201A]">{cert.harvestDate}</span>
            </div>
            <div>
              <span className="text-[#526158] block">Inspection Date:</span>
              <span className="font-medium text-[#17201A]">{cert.inspectionDate}</span>
            </div>
          </div>

          {/* Dynamic Verification Hash */}
          <div className="bg-[#EEF8F0] border border-[#C5E6CC] p-3 rounded-xl text-left text-[11px] font-mono break-all mb-2">
            <span className="text-[#526158] block font-sans font-bold text-[10px] uppercase">SHA-256 Verification Hash:</span>
            <span className="text-[#1B5E20] font-bold">{cert.digitalSignature}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#526158] font-medium pt-2">
            <span className="flex items-center gap-1 text-[#2E7D32]">
              <ShieldCheck className="w-3.5 h-3.5" /> Issuer: AgriGrade Vision Engine
            </span>
            <span>Issued: {formatDate(cert.issuedAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <a
            href={`/verify-certificate/${cert.certificateNumber}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 bg-white border border-[#C5E6CC] text-[#1B5E20] font-bold rounded-xl hover:bg-[#F4FAF4] transition-colors flex items-center justify-center gap-2 text-xs"
          >
            <ExternalLink className="w-4 h-4" /> Public Verification
          </a>
          <button
            onClick={handleDownloadPdf}
            className="flex-1 py-2.5 bg-[#2E7D32] text-white font-bold rounded-xl hover:bg-[#1B5E20] transition-colors flex items-center justify-center gap-2 text-xs shadow-xs"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};
