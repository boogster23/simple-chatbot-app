import FormData from 'form-data'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config();

const ERROR_DEFAULT = 'Sorry, I am unable to process your request right now. Please try again later.'
const openaiApiKey = process.env.OPENAI_API_KEY
const assistantId = process.env.OPENAI_ASSISTANT_ID
const BASE_URL = 'https://api.openai.com/v1'
const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${openaiApiKey}`,
  'OpenAI-Beta': 'assistants=v2'
}

const createThread = async () => {
  const res = await fetch(`${BASE_URL}/threads`, {
    method: 'POST',
    headers: HEADERS,
    body: ''
  });
  if (!res.ok) throw new Error('Failed to create thread');
  const data = await res.json();
  return data.id;
}

const addUserMessage = async (threadId, message, attachments) => {
  const content = Array.isArray(message) ? message : [{ type: 'text', text: message }];
  const attachmentsPayload = await processAttachments(attachments);

  const payload = {
    role: 'user',
    content: message
  };

  console.log(`attachmentsPayload: ${JSON.stringify(attachmentsPayload)}`);

  if (attachmentsPayload.length > 0) {
    payload.attachments = attachmentsPayload;
  }

  console.log(`payload: ${JSON.stringify(payload)}`);
  
  const res = await fetch(`${BASE_URL}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to upload file:', errorText);
    throw new Error('Failed to add user message');
  }
  return await res.json();
}

const runAssistant = async (threadId) => {
  const res = await fetch(`${BASE_URL}/threads/${threadId}/runs`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ assistant_id: assistantId })
  });

  console.log(`Run Assistant response: ${JSON.stringify(res)}`);

  if (!res.ok) throw new Error('Failed to run assistant');
  const data = await res.json();
  return data.id;
}

const waitForRun = async (threadId, runId) => {
  let status = 'in_progress';
  let data;
  while (status === 'in_progress' || status === 'queued') {
    await new Promise(res => setTimeout(res, 1500));
    const res = await fetch(`${BASE_URL}/threads/${threadId}/runs/${runId}`, {
      headers: HEADERS
    });
    if (!res.ok) throw new Error('Failed to fetch run status');
    data = await res.json();
    status = data.status;
  }
  return data;
}


const getLatestAssistantMessage = async (threadId) => {
  const res = await fetch(`${BASE_URL}/threads/${threadId}/messages`, {
    headers: HEADERS
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  const data = await res.json();
  // Find the latest assistant message
  const assistantMsg = data.data.reverse().find(msg => msg.role === 'assistant');
  return assistantMsg ? assistantMsg.content.map(c => c.text?.value || '').join('') : null;
}

const streamGenerateContent = async (message, socket, attachments) => {
  try {
    const threadId = await createThread();
    console.log(`Thread created with ID: ${threadId}`);
    await addUserMessage(threadId, message, attachments);
    console.log(`addUserMessage called with message: ${message}`);
    const runId = await runAssistant(threadId);
    console.log(`Assistant run started with ID: ${runId}`);
    await waitForRun(threadId, runId);
    const reply = await getLatestAssistantMessage(threadId);
    if (reply) {
      reply.split('\n\n').forEach(chunk => {
        if (chunk.trim()) socket.emit('openaiassistant-message', formatText(chunk));
      });
    }
    socket.emit('ai-response-end', 'Stream finished.');
  } catch (error) {
    console.error('Error generating OpenAI Assistant response:', error);
    socket.emit('openaiassistant-message', ERROR_DEFAULT);
  }
}

const formatText = (text) => {
  return text.replace(/\n/g, '<br />');
}

const selectToolsForAttachment = (type) => {

  console.log(`selectToolsForAttachment called with type: ${type}`);

  if (type === 'application/pdf' || type === 'text/plain' || type === 'application/msword' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return [
      { type: 'file_search' },
      { type: 'code_interpreter' }
    ];
  }
  if (type === 'text/csv' || type === 'application/vnd.ms-excel' || type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return [
      { type: 'code_interpreter' },
      { type: 'file_search' }
    ];
  }

  return [{ type: 'code_interpreter' }];
};

const uploadAttachment = async (attachment) => {
  const form = new FormData();

  form.append('file', attachment.content, { filename: attachment.name || 'uploaded_file', contentType: attachment.type });

  const purpose = attachment.type.startsWith('image/') ? 'vision' : 'assistants';
  form.append('purpose', purpose);

  const uploadRes = await fetch(`${BASE_URL}/files`, {
    method: 'POST',
    headers: {
      'Authorization': HEADERS['Authorization'],
      'OpenAI-Beta': HEADERS['OpenAI-Beta']
    },
    body: form
  });
  
  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error('Failed to upload file:', errorText);
    throw new Error(`Failed to upload file: ${uploadRes.status} ${uploadRes.statusText}`);
  }
  
  const { id: fileId } = await uploadRes.json();

  console.log(`File uploaded with ID: ${fileId}`);
  var testTools = selectToolsForAttachment(attachment.type);
  console.log(`Tools selected for attachment: ${JSON.stringify(testTools)}`);
  console.log(`Attachment type: ${attachment.type}`);
  return {
    file_id: fileId,
    tools: selectToolsForAttachment(attachment.type)
  };
};

const processAttachments = async (attachments) => {
  if (!attachments || attachments.length === 0) return [];
  const processed = [];
  for (const attachment of attachments) {
    const att = await uploadAttachment(attachment);
    processed.push(att);
  }
  return processed;
};

export { streamGenerateContent }
