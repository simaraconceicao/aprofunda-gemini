# README: Função Cloud Function para processamento de imagens com o Gemini

Este código implementa uma Cloud Function que processa imagens armazenadas no Google Cloud Storage (GCS) usando o modelo Gemini da Vertex AI.  A função é acionada por um Cloud Event disparado sempre que um novo arquivo é adicionado a um bucket específico do GCS.

##  Componentes do Código:

**1. Importações de Bibliotecas:**

```javascript
const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const { VertexAI } = require('@google-cloud/vertexai');
```

* `@google-cloud/functions-framework`: Biblioteca para criar e implantar Cloud Functions.
* `@google-cloud/storage`: Biblioteca para interagir com o Google Cloud Storage.
* `@google-cloud/vertexai`: Biblioteca para interagir com a Vertex AI.


**2. Configurações:**

```javascript
const project = 'training-simara';
const location = 'us-central1';
const modelName = 'gemini-1.5-flash-002';
```

* `project`: ID do projeto do Google Cloud.  **Substitua `training-simara` pelo ID do seu projeto.**
* `location`: Região do Google Cloud onde os recursos da Vertex AI estão localizados.
* `modelName`: Nome do modelo Gemini a ser usado.


**3. Inicialização de Clientes:**

```javascript
const storage = new Storage();
const vertexAI = new VertexAI({ project, location });
```

* Cria instâncias dos clientes `Storage` e `VertexAI` para interagir com os respectivos serviços.


**4. Configuração do Modelo Generativo:**

```javascript
const generativeModel = vertexAI.preview.getGenerativeModel({
  model: modelName,
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 1,
    topP: 0.95,
  },
  safetySettings: [
    // ... configurações de segurança ...
  ],
});
```

* `getGenerativeModel`: Obtém uma instância do modelo Gemini.
* `generationConfig`: Configurações de geração de texto:
    * `maxOutputTokens`: Número máximo de tokens na resposta.
    * `temperature`: Controla a aleatoriedade da resposta (1 = mais aleatório).
    * `topP`:  Probabilidade cumulativa para seleção de tokens (0.95 indica que os 95% dos tokens mais prováveis são considerados).
* `safetySettings`: Desativa todos os filtros de segurança. **Em produção, você deve configurar esses filtros apropriadamente.**


**5. Função Cloud Event (`helloGCS`):**

```javascript
functions.cloudEvent('helloGCS', async (cloudEvent) => {
  // ... código da função ...
});
```

* `functions.cloudEvent`: Define uma Cloud Function acionada por um Cloud Event.  O nome da função é `helloGCS`.
* `cloudEvent`: Objeto contendo informações sobre o evento (nome do arquivo, bucket, etc.).

**6. Processamento da Imagem:**

```javascript
// Baixa a imagem do bucket
const [imageBuffer] = await storage.bucket(file.bucket).file(file.name).download();

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

// Processa a resposta do Gemini
```

* Baixa a imagem do GCS usando `storage.bucket().file().download()`.
* Converte a imagem para base64 para incluir na requisição do Gemini.
* Monta a requisição para o modelo Gemini, incluindo o prompt em português ("Describe this image in portuguese") e os dados da imagem.
* Envia a requisição para o modelo Gemini usando `generateContentStream` para receber a resposta em streaming.
* Processa a resposta em streaming e a resposta agregada.


**7. Tratamento de Erros:**

```javascript
try {
  // ... código de processamento ...
} catch (error) {
  console.error('Erro durante o processamento:', error);
}
```

* Bloco `try...catch` para capturar e registrar erros durante o processamento.


## Implantação:

Para implantar esta função, você precisará:

1.  **Configurar um projeto no Google Cloud.**
2.  **Habilitar as APIs necessárias:** Cloud Functions, Cloud Storage e Vertex AI.
3.  **Criar um bucket no Google Cloud Storage.**
4.  **Definir um Cloud Event que dispara quando um arquivo é adicionado ao bucket.**
5.  **Instalar as bibliotecas necessárias:** `npm install @google-cloud/functions-framework @google-cloud/storage @google-cloud/vertexai`
6.  **Implantar a função usando o comando `gcloud functions deploy helloGCS` (ou um método equivalente).**


**Observações:**

* Certifique-se que você tem as permissões ideais em sua conta de serviço para cloud run, storage e vertexai.
* Certifique-se de substituir os placeholders (ex: `training-simara`) pelos seus valores reais.
* Este código assume que as imagens são JPEG.  Ajuste `mimeType` conforme necessário para outros tipos de imagem.
* O uso do modelo Gemini pode gerar custos na sua conta do Google Cloud. Monitore o consumo de recursos para controlar os custos.
* A configuração `safetySettings` está desabilitada para fins de exemplo.  Configure-a adequadamente para produção.

Este README fornece uma visão geral do código.  Para detalhes mais específicos sobre as bibliotecas e APIs usadas, consulte a documentação do Google Cloud.