import React, { useState, useRef } from 'react';
import { UploadCloud, FileCheck, AlertCircle, RefreshCw, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function DiseaseDetection({ onPredictionSaved, farmId }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setError(null);
    setResult(null);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop an image first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);
    if (farmId) formData.append('farmId', farmId);

    try {
      const response = await fetch('/api/predict/disease', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Unable to analyze the image. Please try again.');
      }

      if (data.success === false) {
        if (data.error === 'LOW_CONFIDENCE') {
          setResult(data);
        } else {
          setError(data.message || 'Unable to analyze the image. Please try again.');
        }
      } else {
        setResult(data);
        if (onPredictionSaved) onPredictionSaved();
      }
    } catch (err) {
      setError('Unable to analyze the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const getDiseaseColor = (name) => {
    if (name === 'Healthy') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
          Poultry Disease Classifier
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
          Upload a poultry fecal dropping image to run EfficientNetB3 deep learning analysis for early detection of Coccidiosis, Salmonella, and Newcastle Disease.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Upload Zone */}
        <div className={`md:col-span-6 space-y-6`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                  : preview
                  ? 'border-emerald-500/40 bg-slate-900/60'
                  : 'border-slate-700 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/80'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e.target.files[0])}
                accept="image/*"
                className="hidden"
              />

              {preview ? (
                <div className="space-y-4">
                  <div className="relative mx-auto w-48 h-48 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl group">
                    <img src={preview} alt="Upload Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs text-slate-200 font-medium">Click to change</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>{file?.name} ({(file?.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-200">
                      Drag & Drop poultry fecal image here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse from device</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-[11px] text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
                    Supported: JPG, PNG, WEBP (Max 10MB)
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Unable to analyze the image.</p>
                  <p className="text-xs text-rose-300/80">Please try again.</p>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={!file || loading}
                className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg ${
                  !file || loading
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-emerald-950/40 hover:scale-[1.01]'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analyzing image...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    <span>Run Disease Diagnostics</span>
                  </>
                )}
              </button>

              {preview && (
                <button
                  type="button"
                  onClick={resetUpload}
                  disabled={loading}
                  className="px-4 py-3.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results Dashboard */}
        <div className="md:col-span-6">
          {result ? (
            result.success ? (
              <div className="glass-panel rounded-2xl p-6 space-y-6 border border-slate-700/60 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Diagnostic Result
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    Model: EfficientNetB3
                  </span>
                </div>

                {/* Main Classification Badge */}
                <div className={`p-5 rounded-2xl border text-center space-y-2 ${getDiseaseColor(result.prediction)}`}>
                  <div className="flex items-center justify-center space-x-2">
                    {result.prediction === 'Healthy' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-rose-400" />
                    )}
                    <span className="text-xs uppercase font-bold tracking-widest">Prediction</span>
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight">
                    {result.prediction}
                  </h3>
                  <div className="pt-1">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/60 text-slate-200 border border-slate-700">
                      Confidence: {(result.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Probabilities Breakdown */}
                {result.probabilities && Object.keys(result.probabilities).length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Probability Distribution
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(result.probabilities).map(([cls, prob]) => {
                        const pct = (prob * 100).toFixed(1);
                        const isWinner = cls === result.prediction;
                        return (
                          <div key={cls} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className={isWinner ? 'text-slate-100 font-semibold' : 'text-slate-400'}>
                                {cls}
                              </span>
                              <span className={isWinner ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                                {pct}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isWinner
                                    ? cls === 'Healthy'
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                      : 'bg-gradient-to-r from-rose-500 to-amber-500'
                                    : 'bg-slate-600'
                                }`}
                                style={{ width: `${Math.max(parseFloat(pct), 2)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Medical Advisory & Treatment Guidelines */}
                {result.advisory && (
                  <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <span className="font-bold text-slate-200 block text-xs uppercase tracking-wider text-emerald-400">
                        Diagnostic Assessment
                      </span>
                      <p className="text-slate-300 leading-relaxed">{result.advisory.description}</p>
                    </div>

                    {result.advisory.symptoms && (
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                          Key Observed Symptoms
                        </span>
                        <p className="text-slate-300">{result.advisory.symptoms}</p>
                      </div>
                    )}

                    {result.advisory.recommended_treatment && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                        <span className="font-bold text-emerald-300 block text-[11px] uppercase tracking-wider">
                          Recommended Action & Treatment
                        </span>
                        <p className="text-slate-200 leading-relaxed">{result.advisory.recommended_treatment}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Low confidence rejection message state */
              <div className="glass-panel rounded-2xl p-8 border border-rose-500/30 bg-rose-950/15 text-center space-y-4 flex flex-col items-center justify-center min-h-[360px] animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-2 max-w-sm">
                  <h4 className="text-lg font-bold text-rose-300">
                    Image not identified
                  </h4>
                  <p className="text-sm text-slate-300">
                    The uploaded image could not be confidently identified as a poultry fecal sample.
                  </p>
                  <p className="text-xs text-slate-400">
                    Please upload a clear image of chicken/poultry fecal droppings.
                  </p>
                  {result.confidence != null && (
                    <div className="pt-2">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300">
                        Confidence: {(result.confidence * 100).toFixed(1)}% (Threshold: {result.threshold ? (result.threshold * 100).toFixed(1) : '80.0'}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="glass-panel rounded-2xl p-10 text-center space-y-4 border border-slate-800/80 flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center border border-slate-700">
                <Activity className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-base font-semibold text-slate-300">Awaiting Image Diagnostics</h4>
                <p className="text-xs text-slate-500">
                  Select a poultry photo on the left and run analysis to view confidence levels and disease probability charts.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
