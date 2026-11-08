import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Boxes, Plus, Layers, GitFork, Search, ArrowRight } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { activePlant, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'Products' | 'BOM' | 'Routings'>('Products');
  const [products, setProducts] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [routings, setRoutings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Product Modal
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Automobile Assembly');
  const [uom, setUom] = useState('PCS');
  const [standardCycleTimeSeconds, setStandardCycleTimeSeconds] = useState(45);
  const [standardCost, setStandardCost] = useState(1200);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, bomRes, rtgRes] = await Promise.all([
        api.request(`/master-data/products?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/boms?plantId=${activePlant?._id || ''}`),
        api.request(`/master-data/routings?plantId=${activePlant?._id || ''}`)
      ]);

      if (prodRes.success) setProducts(prodRes.list);
      if (bomRes.success) setBoms(bomRes.list);
      if (rtgRes.success) setRoutings(rtgRes.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activePlant]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.request('/master-data/products', {
        method: 'POST',
        body: JSON.stringify({
          plantId: activePlant?._id,
          code,
          name,
          category,
          uom,
          standardCycleTimeSeconds: Number(standardCycleTimeSeconds),
          standardCost: Number(standardCost)
        })
      });
      setShowModal(false);
      setCode('');
      setName('');
      loadData();
    } catch (err: any) {
      alert(`Error creating product: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Products, BOMs & Routings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Finished goods catalog, multi-level Bills of Materials (BOM), and sequential manufacturing operations.
          </p>
        </div>

        {hasPermission('products:edit') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        {(['Products', 'BOM', 'Routings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition-colors ${
              activeTab === tab
                ? 'text-industrial-600 border-b-2 border-industrial-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab === 'Products' && `Products Master (${products.length})`}
            {tab === 'BOM' && `Bills of Materials (${boms.length})`}
            {tab === 'Routings' && `Manufacturing Routings (${routings.length})`}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'Products' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Part / SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">UOM</th>
                  <th className="py-3 px-4">Cycle Time</th>
                  <th className="py-3 px-4">Standard Cost</th>
                  <th className="py-3 px-4">Barcode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">No products configured.</td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.code}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{p.uom}</td>
                      <td className="py-3 px-4">{p.standardCycleTimeSeconds} sec</td>
                      <td className="py-3 px-4 font-medium text-slate-900">₹{p.standardCost?.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.barcode || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'BOM' && (
        <div className="space-y-4">
          {boms.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              No bills of materials defined.
            </div>
          ) : (
            boms.map((bom) => (
              <div key={bom._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {bom.productId?.name} ({bom.productId?.code})
                    </h3>
                    <span className="text-[11px] text-slate-400">BOM Version: {bom.version}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active BOM
                  </span>
                </div>

                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Item / Material Code</th>
                        <th className="py-2 px-3">Material Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Quantity</th>
                        <th className="py-2 px-3">Scrap Allowance</th>
                        <th className="py-2 px-3">Current Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bom.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.materialId?.code}</td>
                          <td className="py-2 px-3 text-slate-800">{item.materialId?.name}</td>
                          <td className="py-2 px-3">{item.materialId?.category}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{item.quantity} {item.uom}</td>
                          <td className="py-2 px-3 text-rose-600">{item.scrapPercentage}%</td>
                          <td className="py-2 px-3 font-semibold text-emerald-700">
                            {item.materialId?.currentStock} {item.materialId?.uom}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'Routings' && (
        <div className="space-y-4">
          {routings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              No manufacturing routings configured.
            </div>
          ) : (
            routings.map((rtg) => (
              <div key={rtg._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {rtg.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{rtg.name}</h3>
                    <p className="text-[11px] text-slate-400">Product: {rtg.productId?.name}</p>
                  </div>
                </div>

                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="py-2 px-3">Sequence</th>
                        <th className="py-2 px-3">Operation Name</th>
                        <th className="py-2 px-3">Cycle Time</th>
                        <th className="py-2 px-3">Setup Time</th>
                        <th className="py-2 px-3">Quality Gate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rtg.operations?.map((op: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900">{op.sequence}</td>
                          <td className="py-2 px-3 font-medium text-slate-800">{op.name}</td>
                          <td className="py-2 px-3">{op.cycleTimeSeconds} sec</td>
                          <td className="py-2 px-3">{op.setupTimeMinutes} mins</td>
                          <td className="py-2 px-3">
                            {op.requiresQualityInspection ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Required Gate
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Create Product SKU</h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Product Code / SKU</label>
                <input
                  type="text"
                  required
                  placeholder="PRD-ROTOR-02"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="Precision Rotor Shaft X2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">UOM</label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="PCS">PCS</option>
                    <option value="SET">SET</option>
                    <option value="BOX">BOX</option>
                    <option value="KG">KG</option>
                    <option value="METER">METER</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cycle Time (sec)</label>
                  <input
                    type="number"
                    required
                    value={standardCycleTimeSeconds}
                    onChange={(e) => setStandardCycleTimeSeconds(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Standard Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={standardCost}
                    onChange={(e) => setStandardCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-industrial-600 hover:bg-industrial-700 text-white rounded-lg text-xs font-medium"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
