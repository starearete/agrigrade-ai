import React, { useState, useEffect } from 'react';
import { certificateService } from '../../services/certificateService';
import { AiCertificate } from '../../types/ai';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CertificatePreviewModal } from '../../components/farmer/CertificatePreviewModal';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Award, ShieldCheck, Eye, ExternalLink } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const FarmerCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<AiCertificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<AiCertificate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await certificateService.getCertificatesForFarmer();
        setCertificates(data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  if (isLoading) return <LoadingState message="Loading your digital quality passports..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1B5E20]">AI Digital Passports & Certificates</h1>
        <p className="text-xs text-[#526158] mt-0.5">
          Cryptographically signed (SHA-256) digital passports generated after AI quality inspection.
        </p>
      </div>

      {certificates.length === 0 ? (
        <EmptyState
          title="No Certificates Issued Yet"
          description="Certificates are automatically generated after your farm batch undergoes AI quality grading."
          actionLabel="Scan Batch Now"
          onAction={() => (window.location.href = '/farmer/batches/create')}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {certificates.map((cert) => (
            <div key={cert.id} className="bg-white border border-[#C5E6CC] rounded-3xl p-5 shadow-xs hover:border-[#2E7D32] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#EEF8F0] text-[#1B5E20] rounded-xl flex items-center justify-center font-bold">
                      <Award className="w-4 h-4 text-[#2E7D32]" />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-xs text-[#17201A]">{cert.certificateNumber}</p>
                      <p className="text-[10px] text-[#526158]">{formatDate(cert.issuedAt)}</p>
                    </div>
                  </div>
                  <StatusBadge status={cert.status} size="sm" />
                </div>

                <h4 className="font-extrabold text-base text-[#1B5E20] mb-2">
                  {cert.cropName} ({cert.varietyName})
                </h4>

                <div className="bg-[#FCFBF5] border border-[#C5E6CC] p-3 rounded-2xl text-xs space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-[#526158]">Grade:</span>
                    <span className="font-extrabold text-[#1B5E20]">{cert.qualityGrade.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#526158]">Quality Score:</span>
                    <span className="font-extrabold text-[#2E7D32]">{cert.qualityScore} / 100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#526158]">Est. Shelf-Life:</span>
                    <span className="font-bold text-[#17201A]">{cert.estimatedRemainingDays} days remaining</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCert(cert)}
                  className="flex-1 py-2 bg-[#EEF8F0] border border-[#C5E6CC] text-[#1B5E20] font-bold text-xs rounded-xl hover:bg-[#DDF2E1] transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Passport Preview
                </button>
                <a
                  href={`/verify-certificate/${cert.certificateNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-white border border-[#C5E6CC] text-[#2E7D32] rounded-xl hover:bg-[#F4FAF4] transition-colors"
                  title="Verify Online"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCert && (
        <CertificatePreviewModal
          certificate={selectedCert}
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
};
