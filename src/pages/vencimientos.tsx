import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

// ─── TIPOS ─────────────────────────────────────────────────────────────
interface Vencimiento {
    id: string;
    nombre_producto: string;
    cantidad: number;
    fecha_vencimiento: string; // ISO date string
}

type NivelAlerta = "vencido" | "critico" | "proximo" | "ok";

// ─── HELPERS ───────────────────────────────────────────────────────────
const diasRestantes = (fecha: string): number => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vence = new Date(fecha);
    vence.setHours(0, 0, 0, 0);
    return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
};

const nivelAlerta = (fecha: string): NivelAlerta => {
    const dias = diasRestantes(fecha);
    if (dias < 0) return "vencido";
    if (dias <= 7) return "critico";
    if (dias <= 30) return "proximo";
    return "ok";
};

const formatFecha = (fecha: string): string => {
    return new Date(fecha + "T12:00:00").toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const NIVEL_CONFIG = {
    vencido: {
        label: "Vencido",
        bg: "bg-red-500/15",
        border: "border-red-500/30",
        text: "text-red-400",
        badge: "bg-red-500/20 text-red-400 border-red-500/30",
        dot: "bg-red-500",
        cardBorder: "border-red-500/40 hover:border-red-500/70",
    },
    critico: {
        label: "Crítico",
        bg: "bg-orange-500/15",
        border: "border-orange-500/30",
        text: "text-orange-400",
        badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        dot: "bg-orange-500",
        cardBorder: "border-orange-500/40 hover:border-orange-500/70",
    },
    proximo: {
        label: "Próximo",
        bg: "bg-yellow-500/15",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
        badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        dot: "bg-yellow-400",
        cardBorder: "border-yellow-500/30 hover:border-yellow-500/60",
    },
    ok: {
        label: "Vigente",
        bg: "bg-green-500/15",
        border: "border-green-500/30",
        text: "text-green-400",
        badge: "bg-green-500/20 text-green-400 border-green-500/30",
        dot: "bg-green-500",
        cardBorder: "border-white/10 hover:border-blue-500",
    },
};

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
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
);
const BoxIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
);
const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
);

export default function Vencimientos() {

    const [items, setItems] = useState<Vencimiento[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [filtroNivel, setFiltroNivel] = useState<NivelAlerta | "todos">("todos");
    const [seleccionado, setSeleccionado] = useState<Vencimiento | null>(null);
    const [modoModal, setModoModal] = useState<"crear" | "editar" | "detalle" | null>(null);
    const [confirmando, setConfirmando] = useState<"editar" | "eliminar" | null>(null);
    const [toast, setToast] = useState<{ texto: string; tipo: "ok" | "error" } | null>(null);

    const [form, setForm] = useState<Partial<Vencimiento>>({
        nombre_producto: "",
        cantidad: undefined,
        fecha_vencimiento: "",
    });

    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => { cargarItems(); }, []);

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

    const mostrarToast = (texto: string, tipo: "ok" | "error" = "ok") => {
        setToast({ texto, tipo });
        setTimeout(() => setToast(null), 3000);
    };

    const cargarItems = async () => {
        const { data, error } = await supabase
            .from("vencimientos")
            .select("*")
            .order("fecha_vencimiento");

        if (error) { mostrarToast("Error al cargar vencimientos", "error"); return; }
        setItems(data || []);
    };

    const itemsFiltrados = items.filter((item) => {
        const q = busqueda.toLowerCase();
        const coincideBusqueda = item.nombre_producto.toLowerCase().includes(q);
        const coincideNivel = filtroNivel === "todos" || nivelAlerta(item.fecha_vencimiento) === filtroNivel;
        return coincideBusqueda && coincideNivel;
    });

    // Contadores por nivel para el banner de alertas
    const contadores = {
        vencido: items.filter(i => nivelAlerta(i.fecha_vencimiento) === "vencido").length,
        critico: items.filter(i => nivelAlerta(i.fecha_vencimiento) === "critico").length,
        proximo: items.filter(i => nivelAlerta(i.fecha_vencimiento) === "proximo").length,
    };

    const totalAlertas = contadores.vencido + contadores.critico + contadores.proximo;

    const cerrarModal = () => {
        setModoModal(null);
        setSeleccionado(null);
        setConfirmando(null);
    };

    const abrirDetalle = (item: Vencimiento) => {
        setSeleccionado(item);
        setConfirmando(null);
        setModoModal("detalle");
    };

    const abrirCrear = () => {
        setForm({ nombre_producto: "", cantidad: undefined, fecha_vencimiento: "" });
        setModoModal("crear");
    };

    const abrirEditar = (item: Vencimiento) => {
        setSeleccionado(item);
        setForm({
            nombre_producto: item.nombre_producto,
            cantidad: item.cantidad,
            fecha_vencimiento: item.fecha_vencimiento,
        });
        setModoModal("editar");
        setConfirmando(null);
    };

    const guardar = async () => {
        if (!form.nombre_producto?.trim()) return mostrarToast("Ingresa el nombre del producto", "error");
        if (!form.cantidad || form.cantidad <= 0) return mostrarToast("Ingresa una cantidad válida", "error");
        if (!form.fecha_vencimiento) return mostrarToast("Ingresa la fecha de vencimiento", "error");

        if (modoModal === "crear") {
            const { data, error } = await supabase
                .from("vencimientos")
                .insert({
                    nombre_producto: form.nombre_producto,
                    cantidad: form.cantidad,
                    fecha_vencimiento: form.fecha_vencimiento,
                })
                .select()
                .single();

            if (error) return mostrarToast("Error al crear", "error");
            setItems(prev => [...prev, data].sort((a, b) =>
                a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)
            ));
            mostrarToast("Registro creado ✓");

        } else if (modoModal === "editar" && seleccionado) {
            const { error } = await supabase
                .from("vencimientos")
                .update({
                    nombre_producto: form.nombre_producto,
                    cantidad: form.cantidad,
                    fecha_vencimiento: form.fecha_vencimiento,
                })
                .eq("id", seleccionado.id);

            if (error) return mostrarToast("Error al actualizar", "error");
            setItems(prev =>
                prev.map(i => i.id === seleccionado.id
                    ? { ...i, ...form as Vencimiento }
                    : i
                ).sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
            );
            mostrarToast("Registro actualizado ✓");
        }

        cerrarModal();
    };

    const eliminar = async (id: string) => {
        const { error } = await supabase.from("vencimientos").delete().eq("id", id);
        if (error) return mostrarToast("Error al eliminar", "error");
        setItems(prev => prev.filter(i => i.id !== id));
        mostrarToast("Registro eliminado");
        cerrarModal();
    };

    const etiquetaDias = (fecha: string): string => {
        const dias = diasRestantes(fecha);
        if (dias < 0) return `Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? "s" : ""}`;
        if (dias === 0) return "Vence hoy";
        if (dias === 1) return "Vence mañana";
        return `Vence en ${dias} días`;
    };

    return (
        <div className="min-h-screen bg-[#0f1117] text-white overflow-x-hidden">

            {/* HEADER */}
            <div className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 bg-[#0f1117]/90">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Vencimientos</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {items.length} productos registrados
                        </p>
                    </div>
                    <button
                        onClick={abrirCrear}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 transition px-5 py-3 rounded-2xl flex items-center justify-center gap-2 font-semibold"
                    >
                        <PlusIcon />
                        Agregar vencimiento
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* BANNER DE ALERTAS — solo si hay productos con problema */}
                {totalAlertas > 0 && (
                    <div className="mb-6 bg-[#1a1f2d] border border-white/10 rounded-3xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-orange-400"><AlertIcon /></span>
                            <h3 className="font-semibold text-sm">
                                {totalAlertas} producto{totalAlertas !== 1 ? "s" : ""} requieren atención
                            </h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {contadores.vencido > 0 && (
                                <button
                                    onClick={() => setFiltroNivel(filtroNivel === "vencido" ? "todos" : "vencido")}
                                    className={`rounded-2xl p-3 border text-center transition ${filtroNivel === "vencido"
                                        ? "bg-red-500/25 border-red-500/50"
                                        : "bg-red-500/10 border-red-500/20 hover:bg-red-500/20"
                                        }`}
                                >
                                    <p className="text-2xl font-bold text-red-400">{contadores.vencido}</p>
                                    <p className="text-xs text-red-400/80 mt-0.5">Vencido{contadores.vencido !== 1 ? "s" : ""}</p>
                                </button>
                            )}
                            {contadores.critico > 0 && (
                                <button
                                    onClick={() => setFiltroNivel(filtroNivel === "critico" ? "todos" : "critico")}
                                    className={`rounded-2xl p-3 border text-center transition ${filtroNivel === "critico"
                                        ? "bg-orange-500/25 border-orange-500/50"
                                        : "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20"
                                        }`}
                                >
                                    <p className="text-2xl font-bold text-orange-400">{contadores.critico}</p>
                                    <p className="text-xs text-orange-400/80 mt-0.5">Crítico{contadores.critico !== 1 ? "s" : ""} ≤7d</p>
                                </button>
                            )}
                            {contadores.proximo > 0 && (
                                <button
                                    onClick={() => setFiltroNivel(filtroNivel === "proximo" ? "todos" : "proximo")}
                                    className={`rounded-2xl p-3 border text-center transition ${filtroNivel === "proximo"
                                        ? "bg-yellow-500/25 border-yellow-500/50"
                                        : "bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20"
                                        }`}
                                >
                                    <p className="text-2xl font-bold text-yellow-400">{contadores.proximo}</p>
                                    <p className="text-xs text-yellow-400/80 mt-0.5">Próximo{contadores.proximo !== 1 ? "s" : ""} ≤30d</p>
                                </button>
                            )}
                        </div>
                        {filtroNivel !== "todos" && (
                            <button
                                onClick={() => setFiltroNivel("todos")}
                                className="mt-3 text-xs text-gray-400 hover:text-white transition"
                            >
                                ← Ver todos
                            </button>
                        )}
                    </div>
                )}

                {/* BUSCADOR */}
                <div className="bg-[#1a1f2d] border border-white/10 rounded-2xl p-4 flex items-center gap-3 mb-6">
                    <SearchIcon />
                    <input
                        ref={searchRef}
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar producto... (Ctrl+K)"
                        className="flex-1 bg-transparent outline-none text-sm sm:text-base"
                    />
                    {busqueda && (
                        <button onClick={() => setBusqueda("")} className="text-gray-400 hover:text-white">
                            <CloseIcon />
                        </button>
                    )}
                </div>

                {/* GRID */}
                {itemsFiltrados.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg">No se encontraron registros</p>
                        <p className="text-sm mt-1">Intenta con otro término de búsqueda</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {itemsFiltrados.map((item) => {
                            const nivel = nivelAlerta(item.fecha_vencimiento);
                            const config = NIVEL_CONFIG[nivel];
                            const dias = diasRestantes(item.fecha_vencimiento);

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => abrirDetalle(item)}
                                    className={`text-left bg-[#1a1f2d] border rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 group w-full ${config.cardBorder}`}
                                >
                                    {/* Nivel badge */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 ${config.badge}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${nivel === "critico" ? "animate-pulse" : ""}`} />
                                            {config.label}
                                        </span>
                                        <span className="text-gray-600 group-hover:text-blue-400 transition">
                                            <ChevronRightIcon />
                                        </span>
                                    </div>

                                    {/* Nombre */}
                                    <h2 className="font-semibold text-lg leading-tight mb-4">
                                        {item.nombre_producto}
                                    </h2>

                                    {/* Fecha y días restantes */}
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Vencimiento</p>
                                            <p className={`text-base font-bold ${config.text}`}>
                                                {formatFecha(item.fecha_vencimiento)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 text-right">
                                            {dias < 0
                                                ? `hace ${Math.abs(dias)}d`
                                                : dias === 0
                                                    ? "¡Hoy!"
                                                    : `en ${dias}d`}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════
                MODAL DETALLE
            ═══════════════════════════════════════ */}
            {modoModal === "detalle" && seleccionado && (() => {
                const nivel = nivelAlerta(seleccionado.fecha_vencimiento);
                const config = NIVEL_CONFIG[nivel];
                return (
                    <div
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
                    >
                        <div className="w-full max-w-md bg-[#1a1f2d] border border-white/10 rounded-3xl overflow-hidden">

                            {/* Cabecera */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div>
                                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium inline-flex items-center gap-1.5 mb-2 ${config.badge}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${nivel === "critico" ? "animate-pulse" : ""}`} />
                                        {config.label}
                                    </span>
                                    <h2 className="text-xl font-bold">{seleccionado.nombre_producto}</h2>
                                </div>
                                <button onClick={cerrarModal} className="text-gray-400 hover:text-white transition">
                                    <CloseIcon />
                                </button>
                            </div>

                            {/* Cuerpo */}
                            <div className="p-6 space-y-4">

                                {/* Alerta contextual */}
                                {nivel !== "ok" && (
                                    <div className={`rounded-2xl p-4 border ${config.bg} ${config.border}`}>
                                        <p className={`text-sm font-semibold ${config.text}`}>
                                            {etiquetaDias(seleccionado.fecha_vencimiento)}
                                        </p>
                                        {nivel === "vencido" && (
                                            <p className="text-xs text-red-400/70 mt-1">
                                                Retira este producto del inventario
                                            </p>
                                        )}
                                        {nivel === "critico" && (
                                            <p className="text-xs text-orange-400/70 mt-1">
                                                Prioriza la venta o consumo inmediato
                                            </p>
                                        )}
                                        {nivel === "proximo" && (
                                            <p className="text-xs text-yellow-400/70 mt-1">
                                                Considera promocionar este producto
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Fecha de vencimiento */}
                                <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                                    <span className={config.text}><CalendarIcon /></span>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Fecha de vencimiento</p>
                                        <p className={`text-lg font-bold ${config.text}`}>
                                            {formatFecha(seleccionado.fecha_vencimiento)}
                                        </p>
                                    </div>
                                </div>

                                {/* Cantidad */}
                                <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                                    <span className="text-blue-400"><BoxIcon /></span>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">Cantidad en inventario</p>
                                        <p className="text-lg font-bold">
                                            {seleccionado.cantidad} <span className="text-gray-400 text-sm font-normal">unidades</span>
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {/* Acciones con confirmación */}
                            <div className="p-6 border-t border-white/10">
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

                                {confirmando === "editar" && (
                                    <div className="space-y-3">
                                        <p className="text-sm text-center text-gray-300">
                                            ¿Confirmas que quieres <span className="text-blue-400 font-semibold">editar</span> este registro?
                                        </p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setConfirmando(null)} className="flex-1 py-3 rounded-2xl border border-white/10 hover:bg-white/5 transition text-sm">
                                                Cancelar
                                            </button>
                                            <button onClick={() => abrirEditar(seleccionado)} className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 transition font-semibold text-sm">
                                                Sí, editar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {confirmando === "eliminar" && (
                                    <div className="space-y-3">
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 text-center">
                                            <p className="text-sm text-red-300 font-medium">
                                                ¿Eliminar "{seleccionado.nombre_producto}"?
                                            </p>
                                            <p className="text-xs text-red-400/70 mt-1">Esta acción no se puede deshacer</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => setConfirmando(null)} className="flex-1 py-3 rounded-2xl border border-white/10 hover:bg-white/5 transition text-sm">
                                                Cancelar
                                            </button>
                                            <button onClick={() => eliminar(seleccionado.id)} className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 transition font-semibold text-sm">
                                                Sí, eliminar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ═══════════════════════════════════════
                MODAL CREAR / EDITAR
            ═══════════════════════════════════════ */}
            {(modoModal === "crear" || modoModal === "editar") && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) cerrarModal(); }}
                >
                    <div className="w-full max-w-lg bg-[#1a1f2d] border border-white/10 rounded-3xl overflow-hidden">

                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold">
                                {modoModal === "crear" ? "Nuevo vencimiento" : "Editar vencimiento"}
                            </h2>
                            <button onClick={cerrarModal} className="text-gray-400 hover:text-white">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">

                            {/* NOMBRE */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Nombre del producto</label>
                                <input
                                    type="text"
                                    value={form.nombre_producto || ""}
                                    onChange={(e) => setForm(prev => ({ ...prev, nombre_producto: e.target.value }))}
                                    placeholder="Ej: Leche entera 1L"
                                    className="w-full bg-[#0f1117] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            {/* CANTIDAD */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Cantidad</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.cantidad ?? ""}
                                    onChange={(e) => setForm(prev => ({ ...prev, cantidad: parseInt(e.target.value) }))}
                                    placeholder="Ej: 24"
                                    className="w-full bg-[#0f1117] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            {/* FECHA VENCIMIENTO */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Fecha de vencimiento</label>
                                <input
                                    type="date"
                                    value={form.fecha_vencimiento || ""}
                                    onChange={(e) => setForm(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
                                    className="w-full bg-[#0f1117] border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-blue-500 transition text-white [color-scheme:dark]"
                                />
                                {/* Preview del nivel si ya hay fecha */}
                                {form.fecha_vencimiento && (() => {
                                    const nivel = nivelAlerta(form.fecha_vencimiento);
                                    const config = NIVEL_CONFIG[nivel];
                                    return (
                                        <p className={`text-xs mt-2 ${config.text}`}>
                                            {etiquetaDias(form.fecha_vencimiento)}
                                        </p>
                                    );
                                })()}
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
                                onClick={guardar}
                                className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 transition font-semibold"
                            >
                                {modoModal === "crear" ? "Crear registro" : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TOAST */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl backdrop-blur-xl z-[100] max-w-[90vw] text-center border ${toast.tipo === "error"
                    ? "bg-red-500/20 border-red-500/30 text-red-300"
                    : "bg-green-500/20 border-green-500/30 text-green-300"
                    }`}>
                    {toast.texto}
                </div>
            )}

        </div>
    );
}