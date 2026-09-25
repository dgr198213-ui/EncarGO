-- Fase 4 (Router multi-IA): hasta ahora el enum no distinguía "el Router lo
-- intentó y falló" de ningún otro estado — sin esto, un fallo real de
-- ejecución se quedaría indefinidamente en "ejecutando".
alter type estado_encargo add value if not exists 'fallido';
