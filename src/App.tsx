/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Download, 
  RefreshCw, 
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateTattooIdea } from './services/gemini';

interface GeneratedImage {
  id: string;
  url: string;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResults([]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    multiple: false,
  } as any);

  const handleGenerate = async () => {
    if (!preview || !description) return;

    setIsGenerating(true);
    setError(null);
    setResults([]);

    try {
      const base64Data = preview.split(',')[1];
      const mimeType = file?.type || 'image/jpeg';

      const generationPromises = [
        generateTattooIdea(base64Data, mimeType, `${description} (variation 1)`),
        generateTattooIdea(base64Data, mimeType, `${description} (variation 2)`),
        generateTattooIdea(base64Data, mimeType, `${description} (variation 3)`),
      ];

      const generatedUrls = await Promise.all(generationPromises);
      
      setResults(generatedUrls.map((url, index) => ({
        id: `res-${index}`,
        url
      })));
    } catch (err) {
      console.error(err);
      setError('Erro ao gerar as simulações. Verifique sua conexão e tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `inkvision-simulacao-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setDescription('');
    setResults([]);
    setError(null);
  };

  return (
    <div className="min-h-screen ink-gradient">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[rgba(8,8,8,0.92)] backdrop-blur-[12px] border-b border-[rgba(242,237,228,0.08)] px-8 h-16 flex items-center justify-between">
        <div className="font-bebas text-2xl tracking-[0.2em]">Ink<span className="text-[#c8392b]">Vision</span></div>
        <a 
          href="https://wa.me/5521983354775?text=Olá!+Quero+agendar+uma+sessão+de+tatuagem." 
          target="_blank" 
          className="bg-[#c8392b] text-white px-5 py-2 font-bebas text-sm tracking-[0.15em] hover:opacity-85 transition-opacity"
        >
          Agendar
        </a>
      </header>

      <main className="max-w-[1000px] mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* COLUNA ESQUERDA */}
        <div className="flex flex-col gap-8">
          <div>
            <div className="text-[0.62rem] tracking-[0.3em] uppercase text-[#c8392b] flex items-center gap-3 before:content-[''] before:w-6 before:h-[1px] before:bg-[#c8392b]">
              Simulação realista com IA
            </div>
            <h1 className="font-bebas text-5xl md:text-6xl mt-4 leading-[0.95]">
              Veja sua tattoo
              <span className="font-pinyon text-[#d4a843] text-[1.05em] block leading-[1.1]">antes da agulha</span>
            </h1>
            <p className="text-[0.88rem] opacity-50 mt-4 leading-[1.75]">
              Envie a foto da região do corpo e descreva sua ideia. Nossa IA gera 3 simulações realistas em segundos.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* UPLOAD */}
            <div>
              <label className="block text-[0.62rem] tracking-[0.25em] uppercase opacity-40 mb-2">1. Foto da região do corpo</label>
              <div 
                {...getRootProps()} 
                className={`upload-box ${preview ? 'has-file' : ''}`}
              >
                <input {...getInputProps()} />
                {!preview ? (
                  <>
                    <div className="w-6 h-[1px] bg-[rgba(242,237,228,0.2)]"></div>
                    <div className="text-[0.82rem] opacity-50">Clique para enviar a foto</div>
                    <div className="text-[0.68rem] opacity-30 mt-1">JPG, PNG — sua imagem não é salva</div>
                  </>
                ) : (
                  <div className="relative w-full h-full">
                    <img src={preview} alt="Preview" className="w-full max-h-[200px] object-cover" />
                    <button 
                      onClick={(e) => { e.stopPropagation(); reset(); }}
                      className="absolute top-2 right-2 bg-black/50 p-1 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="text-[0.68rem] opacity-25 leading-[1.6] mt-1">— Sua foto é usada apenas para gerar a simulação e descartada em seguida.</div>
            </div>

            {/* DESCRIÇÃO */}
            <div>
              <label className="block text-[0.62rem] tracking-[0.25em] uppercase opacity-40 mb-2">2. Descreva sua tatuagem</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: lobo geométrico com flores no antebraço, estilo fineline, traço fino..."
                className="w-full bg-[rgba(242,237,228,0.04)] border border-[rgba(242,237,228,0.08)] text-[#f2ede4] p-4 text-[0.88rem] min-h-[100px] resize-none outline-none focus:border-[rgba(200,57,43,0.5)] transition-colors placeholder:opacity-30"
              />
            </div>

            {/* ERRO */}
            {error && (
              <div className="bg-[rgba(200,57,43,0.1)] border border-[rgba(200,57,43,0.3)] text-[#c8392b] p-4 text-[0.8rem] leading-[1.6]">
                {error}
              </div>
            )}

            {/* BOTÃO */}
            <button 
              onClick={handleGenerate}
              disabled={!preview || !description || isGenerating}
              className="w-full p-4 bg-[#c8392b] text-white font-bebas text-xl tracking-[0.2em] hover:bg-[#a52d21] disabled:bg-[#1a1a1a] disabled:text-[rgba(242,237,228,0.2)] disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
            >
              {isGenerating ? (
                <>
                  <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Gerando simulações...</span>
                </>
              ) : (
                <span>Gerar 3 Simulações</span>
              )}
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="flex flex-col gap-6">
          <div className="text-[0.62rem] tracking-[0.25em] uppercase opacity-30">Resultados</div>

          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {isGenerating ? (
                [1, 2, 3].map((i) => (
                  <motion.div 
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="aspect-[4/3] bg-[rgba(242,237,228,0.04)] border border-[rgba(242,237,228,0.06)] flex items-center justify-center gap-2 text-[0.65rem] opacity-30 tracking-[0.2em]"
                  >
                    <div className="w-4 h-4 border-2 border-[rgba(242,237,228,0.2)] border-t-[rgba(242,237,228,0.6)] rounded-full animate-spin"></div>
                    <span>GERANDO VARIAÇÃO {i}...</span>
                  </motion.div>
                ))
              ) : results.length > 0 ? (
                results.map((result, idx) => (
                  <motion.div 
                    key={result.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative border border-[rgba(242,237,228,0.08)] overflow-hidden"
                  >
                    <img src={result.url} alt={`Simulação ${idx + 1}`} className="w-full aspect-[4/3] object-cover block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                      <span className="text-[0.7rem] text-[#d4a843] tracking-[0.15em] uppercase">Variação {idx + 1}</span>
                      <button 
                        onClick={() => downloadImage(result.url, idx)}
                        className="bg-white/15 hover:bg-white/25 backdrop-blur-[8px] text-white px-3 py-1.5 text-[0.7rem] tracking-[0.1em] transition-colors"
                      >
                        Baixar
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="aspect-[4/3] border border-dashed border-[rgba(242,237,228,0.06)] flex items-center justify-center text-[0.72rem] opacity-20 tracking-[0.15em]">
                  Suas simulações aparecerão aqui
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          {results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#111] border border-[rgba(242,237,228,0.08)] p-7 flex flex-col gap-4"
            >
              <div className="font-pinyon text-3xl text-[#d4a843] leading-[1.1]">Gostou do resultado?</div>
              <p className="text-[0.78rem] opacity-45 leading-[1.7]">Conectamos você ao melhor estúdio parceiro da sua cidade. O valor da simulação é descontado na sessão.</p>
              <a 
                href="https://wa.me/5521983354775?text=Olá!+Gerei+minha+simulação+pelo+InkVision+e+quero+agendar+uma+sessão.+Pode+me+indicar+um+estúdio+parceiro?" 
                target="_blank" 
                className="flex items-center justify-center gap-3 bg-[#c8392b] text-white p-4 text-[0.88rem] font-medium hover:opacity-85 transition-opacity"
              >
                Quero agendar com um estúdio
              </a>
              <a 
                href="https://wa.me/5521983354775?text=Olá!+Gerei+minha+simulação+pelo+InkVision+e+tenho+uma+dúvida+antes+de+agendar." 
                target="_blank" 
                className="flex items-center justify-center gap-3 bg-transparent text-[#f2ede4] p-3 text-[0.82rem] border border-[rgba(242,237,228,0.12)] opacity-55 hover:opacity-100 transition-opacity"
              >
                Tenho uma dúvida antes de fechar
              </a>
            </motion.div>
          )}
        </div>
      </main>

      <footer className="border-t border-[rgba(242,237,228,0.08)] px-8 py-7 flex items-center justify-between flex-wrap gap-4 mt-8">
        <span className="text-[0.65rem] opacity-20 tracking-[0.08em]">© 2026 InkVision. Todos os direitos reservados.</span>
        <a href="https://alchemybrands.co" target="_blank" className="text-[0.62rem] opacity-20 hover:opacity-50 transition-opacity">Powered by Alchemy Brands</a>
      </footer>
    </div>
  );
}
