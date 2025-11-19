// src/pagos/pagos.service.js
import * as pagosModel from "./pagos.model.js";
import * as reservasModel from "../reservas/reservas.model.js";

export const crearPago = async (data) => {
    const { reservaId, monto, metodo } = data;

    // Validar campos
    if (!reservaId || !monto || !metodo) {
        throw new Error("Datos incompletos para registrar el pago.");
    }

    // Validar que la reserva existe
    const reserva = await reservasModel.getReservaById(reservaId);
    if (!reserva) {
        throw new Error("La reserva no existe.");
    }

    // Crear pago
    const pagoData = {
        reservaId,
        monto,
        metodo,
        estado: "CONFIRMADO" // Pagos simples
    };

    return await pagosModel.createPago(pagoData);
};

export const obtenerPagos = () => pagosModel.getAllPagos();
export const obtenerPagoPorId = (id) => pagosModel.getPagoById(id);
export const actualizarPago = (id, data) => pagosModel.updatePago(id, data);
export const eliminarPago = (id) => pagosModel.deletePago(id);
