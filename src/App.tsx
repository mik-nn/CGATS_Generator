import React, { useState } from 'react';
import { Download, Code, Check, Copy } from 'lucide-react';
import { motion } from 'motion/react';

const PRIMARIES = ['C', 'M', 'Y', 'K', 'CM', 'CY', 'MY', 'CMY'];

interface InkLimits {
  [key: string]: number;
}

export default function App() {
  const [selectedPrimaries, setSelectedPrimaries] = useState<string[]>(['C', 'M', 'Y', 'K']);
  const [numPatches, setNumPatches] = useState<number>(11);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [copied, setCopied] = useState(false);
  const [inkLimits, setInkLimits] = useState<InkLimits>({
    C: 100,
    M: 100,
    Y: 100,
    K: 100,
    CM: 100,
    CY: 100,
    MY: 100,
    CMY: 100,
  });

  const togglePrimary = (p: string) => {
    setSelectedPrimaries(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const updateInkLimit = (primary: string, value: number) => {
    setInkLimits(prev => ({
      ...prev,
      [primary]: Math.max(0, Math.min(100, value)),
    }));
  };

  const generateCGATSContent = () => {
    const lines = [];
    lines.push("CGATS.17");
    lines.push('ORIGINATOR\t"Web CGATS Generator"');
    lines.push('DESCRIPTOR\t"Custom CMYK Target"');
    lines.push(`CREATED\t"${new Date().toISOString().split('T')[0]}"`);
    
    const patches: any[] = [];
    
    const getCmyk = (primary: string, stepVal: number) => {
      const limit = inkLimits[primary] || 100;
      const c = primary.includes('C') ? (stepVal * limit / 100.0) : 0.0;
      const m = primary.includes('M') ? (stepVal * limit / 100.0) : 0.0;
      const y = primary.includes('Y') ? (stepVal * limit / 100.0) : 0.0;
      const k = primary.includes('K') ? (stepVal * limit / 100.0) : 0.0;
      return { c, m, y, k };
    };

    selectedPrimaries.forEach((primary, pIdx) => {
      for (let sIdx = 0; sIdx < numPatches; sIdx++) {
        const stepVal = numPatches > 1 ? (sIdx / (numPatches - 1)) * 100.0 : 100.0;
        const { c, m, y, k } = getCmyk(primary, stepVal);
        
        let row, col;
        if (orientation === 'portrait') {
          col = pIdx + 1;
          row = sIdx + 1;
        } else {
          row = pIdx + 1;
          col = sIdx + 1;
        }
        
        patches.push({ row, col, c, m, y, k });
      }
    });

    patches.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });

    lines.push("NUMBER_OF_FIELDS\t7");
    lines.push("BEGIN_DATA_FORMAT");
    lines.push("SAMPLE_ID\tRow\tCol\tCMYK_C\tCMYK_M\tCMYK_Y\tCMYK_K");
    lines.push("END_DATA_FORMAT");
    
    lines.push(`NUMBER_OF_SETS\t${patches.length}`);
    lines.push("BEGIN_DATA");
    
    patches.forEach((p, idx) => {
      lines.push(`${idx + 1}\t${p.row}\t${p.col}\t${p.c.toFixed(2)}\t${p.m.toFixed(2)}\t${p.y.toFixed(2)}\t${p.k.toFixed(2)}`);
    });
    
    lines.push("END_DATA");
    
    return lines.join('\n');
  };

  const downloadCGATS = () => {
    if (selectedPrimaries.length === 0) {
      alert("Please select at least one primary.");
      return;
    }
    const content = generateCGATSContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'target.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pythonScript = `import datetime

def generate_cgats(primaries, num_patches, orientation, ink_limits, filename="output.txt"):
    lines = []
    lines.append("CGATS.17")
    lines.append('ORIGINATOR\\t"Python CGATS Generator"')
    lines.append('DESCRIPTOR\\t"Custom CMYK Target"')
    lines.append(f'CREATED\\t"{datetime.datetime.now().strftime("%Y-%m-%d")}"')
    
    patches = []
    
    def get_cmyk(primary, step_val, limits):
        limit = limits.get(primary, 100)
        c = (step_val * limit / 100.0) if 'C' in primary else 0.0
        m = (step_val * limit / 100.0) if 'M' in primary else 0.0
        y = (step_val * limit / 100.0) if 'Y' in primary else 0.0
        k = (step_val * limit / 100.0) if 'K' in primary else 0.0
        return (c, m, y, k)

    for p_idx, primary in enumerate(primaries):
        for s_idx in range(num_patches):
            step_val = (s_idx / (num_patches - 1)) * 100.0 if num_patches > 1 else 100.0
            c, m, y, k = get_cmyk(primary, step_val, ink_limits)
            
            if orientation == 'portrait':
                col = p_idx + 1
                row = s_idx + 1
            else:
                row = p_idx + 1
                col = s_idx + 1
                
            patches.append((row, col, c, m, y, k))
            
    patches.sort(key=lambda x: (x[0], x[1]))

    lines.append("NUMBER_OF_FIELDS\\t7")
    lines.append("BEGIN_DATA_FORMAT")
    lines.append("SAMPLE_ID\\tRow\\tCol\\tCMYK_C\\tCMYK_M\\tCMYK_Y\\tCMYK_K")
    lines.append("END_DATA_FORMAT")
    
    lines.append(f"NUMBER_OF_SETS\\t{len(patches)}")
    lines.append("BEGIN_DATA")
    
    for idx, (row, col, c, m, y, k) in enumerate(patches):
        lines.append(f"{idx+1}\\t{row}\\t{col}\\t{c:.2f}\\t{m:.2f}\\t{y:.2f}\\t{k:.2f}")
        
    lines.append("END_DATA")
    
    with open(filename, 'w') as f:
        f.write("\\n".join(lines))
    print(f"Saved {filename}")

if __name__ == "__main__":
    primaries = ${JSON.stringify(selectedPrimaries).replace(/"/g, "'")}
    num_patches = ${numPatches}
    orientation = '${orientation}'
    ink_limits = ${JSON.stringify(inkLimits).replace(/"/g, "'")}
    generate_cgats(primaries, num_patches, orientation, ink_limits)
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-slate-900 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-light tracking-tight mb-2">CGATS 1.7 Generator</h1>
          <p className="text-slate-500">Configure parameters to generate a custom color profiling target or copy the Python script.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Configuration</h2>
              
              {/* Primaries */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-3">Primaries</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIMARIES.map(p => (
                    <button
                      key={p}
                      onClick={() => togglePrimary(p)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedPrimaries.includes(p) 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Patches */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Number of Patches per Primary
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="256"
                  value={numPatches}
                  onChange={(e) => setNumPatches(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Orientation */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-3">Sequence Orientation</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      orientation === 'portrait' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                      orientation === 'landscape' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Ink Limits */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 mb-3">Ink Limits per Primary (%)</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIMARIES.map(p => (
                    <div key={p} className="flex flex-col items-center">
                      <span className="text-xs font-medium text-slate-500 mb-1">{p}</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={inkLimits[p]}
                        onChange={(e) => updateInkLimit(p, parseInt(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={downloadCGATS}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 px-4 font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={18} />
                Download CGATS File
              </button>
            </div>
          </div>

          {/* Output Column */}
          <div className="lg:col-span-8">
            <div className="bg-[#1e1e1e] rounded-2xl shadow-sm overflow-hidden flex flex-col h-full border border-slate-200">
              <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-[#3d3d3d]">
                <div className="flex items-center gap-2 text-slate-300">
                  <Code size={16} />
                  <span className="text-sm font-mono">generate_cgats.py</span>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium bg-[#3d3d3d] px-3 py-1.5 rounded-md"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <div className="p-6 overflow-auto bg-[#1e1e1e] text-slate-300 font-mono text-sm leading-relaxed flex-1">
                <pre><code>{pythonScript}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
