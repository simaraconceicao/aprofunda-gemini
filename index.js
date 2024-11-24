const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const { VertexAI } = require('@google-cloud/vertexai');

// Configurações iniciais
const project = 'training-simara';
const location = 'us-central1';
const modelName = 'gemini-1.5-flash-002';

// Inicializa os clientes
const storage = new Storage();
const vertexAI = new VertexAI({ project, location });

// Configura o modelo generativo
const generativeModel = vertexAI.preview.getGenerativeModel({
  model: modelName,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  },
  safetySettings: [
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'OFF' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'OFF' },
  ],
});

// Registra a função CloudEvent
functions.cloudEvent('helloGCS', async (cloudEvent) => {
  const file = cloudEvent.data;

  console.log(`Event ID: ${cloudEvent.id}`);
  console.log(`Event Type: ${cloudEvent.type}`);
  console.log(`Bucket: ${file.bucket}`);
  console.log(`File: ${file.name}`);
  console.log(`Metageneration: ${file.metageneration}`);
  console.log(`Created: ${file.timeCreated}`);
  console.log(`Updated: ${file.updated}`);

  try {
    // Baixa a imagem do bucket
    const [imageBuffer] = await storage.bucket(file.bucket).file(file.name).download();
    console.log(`Imagem baixada com sucesso: ${file.name}`);

    // Prepara a requisição para o modelo
    const imageInlineData = {
      inlineData: {
        mimeType: 'image/jpeg', // Ajuste conforme o tipo de imagem
        data: imageBuffer.toString('base64'), // Converte o buffer para base64
      },
    };

    const request = {
      contents: [
        { role: 'user', parts: [{ text: 'Describe this image in portuguese' }, imageInlineData] },
      ],
    };

    // Chama o modelo Gemini
    const streamingResp = await generativeModel.generateContentStream(request);

    console.log('Resposta do Gemini:');
    for await (const item of streamingResp.stream) {
      console.log('Chunk recebido: ', JSON.stringify(item));
    }

    const aggregatedResponse = await streamingResp.response;
    console.log('Resposta agregada:', JSON.stringify(aggregatedResponse, null, 2));
  } catch (error) {
    console.error('Erro durante o processamento:', error);
  }
});
