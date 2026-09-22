import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateService } from '../../services/certificateService';
import { AiCertificate } from '../../types/ai';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Sprout, ShieldCheck, CheckCircle2, AlertTriangle, Search, ExternalLink, Award } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const VerifyCertificatePage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [queryId, setQueryId] = useState<string>(certificateId || 'AGRI-CERT-2026-88192');
  const [cert, setCert] = useState<AiCertificate | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  const fetchCertificate = async (id: string) => {
    setIsLoading(true);
    setSearched(true);
    try {
      const res = await certificateService.getCertificateByNumber(id);
      setCert(res);
    } catch (e) {
      setCert(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (certificateId) {
      fetchCertificate(certificateId);
    } else {
      fetchCertificate('AGRI-CERT-2026-88192');
    }
  }, [certificateId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (queryId.trim()) {
      fetchCertificate(queryId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF5] text-[#17201A] p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-[#2E7D32] text-white rounded-xl flex items-center justify-center font-bold">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-xl text-[#1B5E20]">AgriGrade AI</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-[#1B5E20]">Public Certificate Verification</h1>
          <p className="text-xs text-[#526158] mt-1 max-w-md mx-auto">
            Verify SHA-256 digital signature hashes and inspection metrics for AgriGrade AI-certified harvests.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#526158] absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g. AGRI-CERT-2026-88192)"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-white border border-[#C5E6CC] rounded-2xl focus:ring-2 focus:ring-[#2E7D32] focus:outline-none text-xs font-bold font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-[#2E7D32] text-white font-bold text-xs rounded-2xl hover:bg-[#1B5E20] transition-colors shadow-xs"
            >
              {isLoading ? 'Verifying...' : 'Verify Passport'}
            </button>
          </div>
        </form>

        {/* Certificate Verification Display */}
        {searched && cert ? (
          <div className="bg-white border-2 border-[#2E7D32] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#C5E6CC] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#EEF8F0] text-[#1B5E20] rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-[#2E7D32]" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-[#EEF8F0] text-[#1B5E20] text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-[#C5E6CC] flex items-center gap-1 inline-flex mb-1">
                    <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" /> Authenticated Passport
                  </span>
                  <h3 className="font-extrabold text-lg text-[#17201A] font-mono">{cert.certificateNumber}</h3>
                </div>
              </div>
              <StatusBadge status={cert.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs mb-6 bg-[#FCFBF5] border border-[#C5E6CC] p-4 rounded-2xl">
              <div>
                <span className="text-[#526158] block text-[11px]">Crop & Variety</span>
                <span className="font-extrabold text-[#17201A]">{cert.cropName} ({cert.varietyName})</span>
              </div>
              <div>
                <span className="text-[#526158] block text-[11px]">Assigned Grade</span>
                <span className="font-extrabold text-[#1B5E20]">{cert.qualityGrade.replace(/_/g, ' ')}</span>
              </div>
              <div>
                <span className="text-[#526158] block text-[11px]">Quality Score</span>
                <span className="font-extrabold text-[#2E7D32] text-sm">{cert.qualityScore} / 100</span>
              </div>
              <div>
                <span className="text-[#526158] block text-[11px]">Est. Shelf-Life</span>
                <span className="font-bold text-[#17201A]">{cert.estimatedRemainingDays} days remaining</span>
              </div>
              <div>
                <span className="text-[#526158] block text-[11px]">Harvest Date</span>
                <span className="font-medium text-[#17201A]">{cert.harvestDate}</span>
              </div>
              <div>
                <span className="text-[#526158] block text-[11px]">Inspection Date</span>
                <span className="font-medium text-[#17201A]">{cert.inspectionDate}</span>
              </div>
            </div>

            {/* SHA-256 Hash Box */}
            <div className="bg-[#EEF8F0] border border-[#C5E6CC] p-4 rounded-2xl text-xs mb-6">
              <span className="font-bold text-[#1B5E20] block mb-1">Cryptographic Digital Signature (SHA-256)</span>
              <span className="font-mono text-[11px] text-[#17201A] break-all block bg-white p-2.5 rounded-xl border border-[#C5E6CC]">
                {cert.digitalSignature}
              </span>
            </div>

            <div className="text-center">
              <p className="text-[11px] text-[#526158]">
                This certificate record is authoritatively verified by the AgriGrade AI Inspection Engine.
              </p>
            </div>
          </div>
        ) : searched ? (
          <div className="bg-white border border-red-200 rounded-3xl p-8 shadow-xs text-center">
            <div className="w-14 h-14 bg-red-50 text-[#B3261E] rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-lg text-[#17201A] mb-1">Certificate Not Found</h3>
            <p className="text-xs text-[#526158] max-w-sm mx-auto">
              No matching certificate found for "{queryId}". Please double-check the ID or verify that the certificate was issued.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
