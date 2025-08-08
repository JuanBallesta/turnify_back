const axios = require("axios");
require("dotenv").config(); // Asegúrate de que esta línea esté al principio del archivo principal (index.js)

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GOOGLE_API_KEY}`;
// --- PREGUNTAS FRECUENTES (FAQs) PERSONALIZADAS PARA TURNIFY ---
const faqs = {
  // --- Preguntas sobre Reservas y Citas ---
  "como reservar un turno":
    "Para reservar, ve a la sección 'Reservar Cita', elige un servicio, selecciona un profesional (o cualquiera), y luego escoge una fecha y un horario disponible en el calendario.",
  "puedo cancelar una cita":
    "Sí, puedes cancelar tus citas desde la sección 'Mis Citas'. Ten en cuenta que solo puedes hacerlo con más de 24 horas de antelación.",
  "cancelar mi turno":
    "Sí, puedes cancelar tus citas desde la sección 'Mis Citas'. Ten en cuenta que solo puedes hacerlo con más de 24 horas de antelación.",
  "ver mis citas":
    "Puedes ver todas tus citas programadas y tu historial en la sección 'Mis Citas' de tu panel de control.",
  "modificar una cita":
    "Actualmente, no se pueden modificar las citas. Debes cancelar la cita existente (si cumples con la política de 24 horas) y reservar una nueva.",

  // --- Preguntas sobre la Cuenta y Perfil ---
  "como cambio mi contraseña":
    "Puedes cambiar tu contraseña en la sección 'Mi Perfil', en la pestaña de 'Seguridad'. Necesitarás tu contraseña actual.",
  "olvide mi contraseña":
    "En la página de inicio de sesión, haz clic en '¿Olvidaste tu contraseña?'. Te enviaremos un correo para que puedas establecer una nueva.",
  "actualizar mi perfil":
    "Puedes actualizar tu nombre, teléfono y foto de perfil en la sección 'Mi Perfil'. El correo electrónico no se puede cambiar.",

  // --- Preguntas sobre Funcionalidades ---
  "que es turnify":
    "Turnify es una plataforma para gestionar y reservar citas en negocios de belleza y bienestar. Conecta a clientes con profesionales y facilita la administración de los negocios.",
  "horario de atencion":
    "El horario de atención depende de cada negocio y profesional. Puedes ver la disponibilidad en tiempo real al momento de reservar una cita.",
  "metodos de pago":
    "El pago se realiza directamente en el negocio al momento de tu cita. La plataforma se encarga de la reserva, pero no procesa pagos.",
};

const removeAccents = (str) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

exports.askQuestion = async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: "La pregunta es requerida." });
  }

  // Búsqueda en FAQs
  const normalizedQuestion = removeAccents(question);
  for (const [faqKey, faqAnswer] of Object.entries(faqs)) {
    if (normalizedQuestion.includes(removeAccents(faqKey))) {
      console.log(`[Chatbot] Respuesta encontrada en FAQ para: "${question}"`);
      return res.json({
        question,
        answer: faqAnswer,
        source: "faq",
      });
    }
  }

  // Fallback a Google AI
  if (!GOOGLE_API_KEY) {
    console.error("Error: GOOGLE_API_KEY no está configurada.");
    return res
      .status(500)
      .json({ error: "Error de configuración del servidor." });
  }

  try {
    console.log(`[Chatbot] Pregunta enviada a Google AI: "${question}"`);
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Eres un asistente virtual para una aplicación de reserva de turnos llamada Turnify. Responde la siguiente pregunta de forma breve y amigable: "${question}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
      },
    };

    const headers = { "Content-Type": "application/json" };
    const response = await axios.post(API_URL, payload, { headers });

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      return res.json({
        question,
        answer: aiResponse,
        source: "ai",
      });
    } else {
      let reason = "La respuesta de la IA no pudo ser procesada.";
      if (response.data?.promptFeedback?.blockReason) {
        reason = `Solicitud bloqueada por: ${response.data.promptFeedback.blockReason}`;
      }
      return res.status(500).json({ error: reason, details: response.data });
    }
  } catch (error) {
    console.error(
      "Error al conectar con Google AI:",
      error.response ? error.response.data : error.message
    );
    return res.status(500).json({
      error: "Error al procesar la solicitud con la IA.",
      details: error.response?.data?.error?.message || error.message,
    });
  }
};
