import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

// ─── TIPOS ─────────────────────────────────────────────────────────────
interface Producto {
    id: string;
    nombre: string;
    precio: number;
    precio_anterior: number | null;
}

// ─── ICONOS ────────────────────────────────────────────────────────────
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
);

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export default function Productos() {

    const [productos, setProductos] = useState<Producto[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
    const [modoModal, setModoModal] = useState<"crear" | "editar" | "detalle" | null>(null);
    const [toast, setToast] = useState<{ texto: string; tipo: "ok" | "error" } | null>(null);

    // Estado para doble confirmación
    const [confirmando, setConfirmando] = useState<"editar" | "eliminar" | null>(null);

    const [form, setForm] = useState<Partial<Producto>>({
        nombre: "",
        precio: undefined,
    });

    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        cargarProductos();
    }, []);

    const mostrarToast = (texto: string, tipo: "ok" | "error" = "ok") => {
        setToast({ texto, tipo });
        setTimeout(() => setToast(null), 3000);
    };

    const cargarProductos = async () => {
        const { data, error } = await supabase
            .from("productos")
            .select("*")
            .order("nombre");

        if (error) {
            mostrarToast("Error al cargar productos", "error");
            return;
        }

        setProductos(data || []);
    };

    const productosFiltrados = productos.filter((p) => {
        const q = busqueda.toLowerCase();
        return p.nombre.toLowerCase().includes(q);
    });

    // ── Abrir modal de DETALLE al hacer click en la card ──
    const abrirDetalle = (p: Producto) => {
        setProductoSeleccionado(p);
        setConfirmando(null);
        setModoModal("detalle");
    };

    const abrirCrear = () => {
        setForm({ nombre: "", precio: undefined });
        setModoModal("crear");
    };

    const abrirEditar = (p: Producto) => {
        setProductoSeleccionado(p);
        setForm({ nombre: p.nombre, precio: p.precio });
        setModoModal("editar");
        setConfirmando(null);
    };

    const cerrarModal = () => {
        setModoModal(null);
        setProductoSeleccionado(null);
        setConfirmando(null);
    };

    // ── Guardar: si el precio cambió, precio actual → precio_anterior ──
    const guardarProducto = async () => {
        if (!form.nombre?.trim()) return mostrarToast("Ingresa el nombre", "error");
        if (!form.precio) return mostrarToast("Ingresa un precio", "error");

        if (modoModal === "crear") {
            const { data, error } = await supabase
                .from("productos")
                .insert({
                    nombre: form.nombre,
                    precio: form.precio,
                    precio_anterior: null,
                })
                .select()
                .single();

            if (error) return mostrarToast("Error al crear", "error");

            setProductos((prev) => [data, ...prev]);
            mostrarToast("Producto creado ✓");

        } else if (modoModal === "editar" && productoSeleccionado) {

            // Si el precio cambió, guardamos el anterior
            const precioCambio = form.precio !== productoSeleccionado.precio;
            const nuevoPrecioAnterior = precioCambio
                ? productoSeleccionado.precio
                : productoSeleccionado.precio_anterior;

            const { error } = await supabase
                .from("productos")
                .update({
                    nombre: form.nombre,
                    precio: form.precio,
                    precio_anterior: nuevoPrecioAnterior,
                })
                .eq("id", productoSeleccionado.id);

            if (error) return mostrarToast("Error al actualizar", "error");

            setProductos((prev) =>
                prev.map((p) =>
                    p.id === productoSeleccionado.id
                        ? {
                            ...p,
                            nombre: form.nombre!,
                            precio: form.precio!,
                            precio_anterior: nuevoPrecioAnterior ?? null,
                        }
                        : p
                )
            );

            mostrarToast("Producto actualizado ✓");
        }

        cerrarModal();
    };

    const eliminarProducto = async (id: string) => {
        const { error } = await supabase
            .from("productos")
            .delete()
            .eq("id", id);

        if (error) return mostrarToast("Error al eliminar", "error");

        setProductos((prev) => prev.filter((p) => p.id !== id));
        mostrarToast("Producto eliminado");
        cerrarModal();
    };

    // ── Atajos de teclado ──
    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                searchRef.current?.focus();
            }
            if (e.key === "Escape") cerrarModal();
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, []);

    // ── Variación de precio ──
    const variacionPrecio = (p: Producto) => {
        if (!p.precio_anterior || p.precio_anterior === 0) return null;
        const diff = p.precio - p.precio_anterior;
        const pct = ((diff / p.precio_anterior) * 100).toFixed(1);
        return { diff, pct: parseFloat(pct), subio: diff > 0 };
    };

    return (
        <div className="min-h-screen bg-[#0f1117] text-white overflow-x-hidden">

            {/* HEADER */}
            <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[#0f1117]/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Productos</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {productos.length} productos registrados
                        </p>
                    </div>
                    <button
                        onClick={abrirCrear}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 transition px-5 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold"
                    >
                        <PlusIcon />
                        Agregar producto
                    </button>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* BUSCADOR */}
                <div className="bg-[#1a1f2d] border border-white/10 rounded-2xl p-4 flex items-center gap-3 mb-6">
                    <SearchIcon />
                    <input
                        ref={searchRef}
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre... (Ctrl+K)"
                        className="flex-1 bg-transparent outline-none text-sm sm:text-base"
                    />
                    {busqueda && (
                        <button onClick={() => setBusqueda("")} className="text-gray-400 hover:text-white">
                            <CloseIcon />
                        </button>
                    )}
                </div>

                {/* GRID — cards limpias, solo nombre y precio */}
                {productosFiltrados.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg">No se encontraron productos</p>
                        <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {productosFiltrados.map((p) => {
                            const variacion = variacionPrecio(p);
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => abrirDetalle(p)}
                                    className="text-left bg-[#1a1f2d] border border-white/10 rounded-3xl p-5 hover:border-blue-500 transition-all duration-300 hover:-translate-y-1 group w-full"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <span className="text-xs text-blue-400 px-2.5 py-1 rounded-full border border-blue-400 font-medium flex items-center gap-1.5">
                                            Mas Detalles
                                        </span>
                                        <span className="text-gray-600 group-hover:text-blue-400 transition">
                                            <ChevronRightIcon />
                                        </span>
                                    </div>

                                    <h2 className="font-semibold text-lg leading-tight mb-4">
                                        {p.nombre}
                                    </h2>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Precio actual</p>
                                            <span className="text-2xl font-bold text-blue-400">
                                                Bs {p.precio.toFixed(2)}
                                            </span>
                                        </div>
                                        {/* Indicador de variación si hay precio anterior */}
                                        {variacion && (
                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${variacion.subio
                                                ? "bg-red-500/15 text-red-400"
                                                : "bg-green-500/15 text-green-400"
                                                }`}>
                                                {variacion.subio ? "▲ Subió" : "▼ Bajó"} {Math.abs(variacion.pct)}%
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                MODAL DETALLE — info completa + botones con confirmación
            ═══════════════════════════════════════════════════════════ */}
            {modoModal === "detalle" && productoSeleccionado && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
                >
                    <div className="w-full max-w-md bg-[#1a1f2d] border border-white/10 rounded-3xl overflow-hidden">

                        {/* Cabecera */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-xl font-bold">{productoSeleccionado.nombre}</h2>
                            </div>
                            <button onClick={cerrarModal} className="text-gray-400 hover:text-white transition">
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Cuerpo */}
                        <div className="p-6 space-y-4">

                            {/* Precio actual */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Precio actual</p>
                                    <p className="text-3xl font-bold text-blue-400">
                                        Bs {productoSeleccionado.precio.toFixed(2)}
                                    </p>
                                </div>
                                {variacionPrecio(productoSeleccionado) && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 mb-1">Variación</p>
                                        {(() => {
                                            const v = variacionPrecio(productoSeleccionado)!;
                                            return (
                                                <span className={`text-sm font-bold ${v.subio ? "text-red-400" : "text-green-400"}`}>
                                                    {v.subio ? "▲ Subió " : "▼ Bajó "}
                                                    {v.diff.toFixed(2)} ({v.subio ? "+" : ""}{v.pct}%)
                                                </span>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>

                            {/* Precio anterior (oculto si no existe) */}
                            {productoSeleccionado.precio_anterior !== null && (
                                <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-gray-500">
                                        <HistoryIcon />
                                    </span>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Precio anterior</p>
                                        <p className="text-lg font-semibold text-gray-300">
                                            Bs {productoSeleccionado.precio_anterior.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Zona de acciones con confirmación */}
                        <div className="p-6 border-t border-white/10">

                            {/* Sin confirmar → botones normales */}
                            {!confirmando && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmando("eliminar")}
                                        className="flex-1 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition flex items-center justify-center gap-2 font-medium"
                                    >
                                        <TrashIcon />
                                        Eliminar
                                    </button>
                                    <button
                                        onClick={() => setConfirmando("editar")}
                                        className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 transition flex items-center justify-center gap-2 font-semibold"
                                    >
                                        <EditIcon />
                                        Editar
                                    </button>
                                </div>
                            )}

                            {/* Confirmación EDITAR */}
                            {confirmando === "editar" && (
                                <div className="space-y-3">
                                    <p className="text-sm text-center text-gray-300">
                                        ¿Confirmas que quieres <span className="text-blue-400 font-semibold">editar</span> este producto?
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConfirmando(null)}
                                            className="flex-1 py-3 rounded-2xl border border-white/10 hover:bg-white/5 transition text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => abrirEditar(productoSeleccionado)}
                                            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 transition font-semibold text-sm"
                                        >
                                            Sí, editar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Confirmación ELIMINAR */}
                            {confirmando === "eliminar" && (
                                <div className="space-y-3">
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center">
                                        <p className="text-sm text-red-300 font-medium">
                                            ¿Eliminar "{productoSeleccionado.nombre}"?
                                        </p>
                                        <p className="text-xs text-red-400/70 mt-1">
                                            Esta acción no se puede deshacer
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConfirmando(null)}
                                            className="flex-1 py-3 rounded-2xl border border-white/10 hover:bg-white/5 transition text-sm"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => eliminarProducto(productoSeleccionado.id)}
                                            className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 transition font-semibold text-sm"
                                        >
                                            Sí, eliminar
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                MODAL CREAR / EDITAR
            ═══════════════════════════════════════════════════════════ */}
            {(modoModal === "crear" || modoModal === "editar") && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
                >
                    <div className="w-full max-w-lg bg-[#1a1f2d] border border-white/10 rounded-3xl overflow-hidden">

                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-xl font-bold">
                                    {modoModal === "crear" ? "Nuevo producto" : "Editar producto"}
                                </h2>
                                {modoModal === "editar" && form.precio !== productoSeleccionado?.precio && (
                                    <p className="text-xs text-yellow-400 mt-1">
                                        ⚡ El precio anterior se guardará automáticamente
                                    </p>
                                )}
                            </div>
                            <button onClick={cerrarModal} className="text-gray-400 hover:text-white">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* NOMBRE */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Nombre del producto
                                </label>
                                <input
                                    type="text"
                                    value={form.nombre || ""}
                                    onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                                    placeholder="Ej: Coca Cola 2L"
                                    className="w-full bg-[#0f1117] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            {/* PRECIO */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Precio
                                    {modoModal === "editar" && productoSeleccionado && (
                                        <span className="ml-2 text-gray-500">
                                            (actual: Bs {productoSeleccionado.precio.toFixed(2)})
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.precio ?? ""}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            precio: parseFloat(e.target.value),
                                        }))
                                    }
                                    placeholder="Ej: 15.50"
                                    className="w-full bg-[#0f1117] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition"
                                />
                            </div>

                        </div>

                        <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={cerrarModal}
                                className="flex-1 py-3 rounded-2xl border border-white/10 hover:bg-white/5 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarProducto}
                                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 transition font-semibold"
                            >
                                {modoModal === "crear" ? "Crear producto" : "Guardar cambios"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl backdrop-blur-xl z-[100] max-w-[90vw] text-center border transition-all ${toast.tipo === "error"
                    ? "bg-red-500/20 border-red-500/30 text-red-300"
                    : "bg-green-500/20 border-green-500/30 text-green-300"
                    }`}>
                    {toast.texto}
                </div>
            )}

        </div>
    );
}