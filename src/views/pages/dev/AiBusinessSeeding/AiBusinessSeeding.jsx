import { faRobot, faBolt, faCheckCircle, faShop, faUser, faPaperPlane, faTrash, faHome, faEllipsisV, faTimes, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Input, message, Switch, Typography, Dropdown } from 'antd';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { generativeModel } from '../../../../firebase/firebaseconfig';
import { ACTIONS, getSystemPrompt } from './aiActions';

const { TextArea } = Input;
const { Title, Text } = Typography;

// --- STYLED COMPONENTS ---
const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f4f7fe;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
`;

const Header = styled.header`
  height: 60px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 2rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  z-index: 10;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 18px;
  color: #333;
`;

const Workspace = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const ChatColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const CanvasColumn = styled.aside`
  width: 420px;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1.5rem;
  gap: 1.5rem;
  box-shadow: -4px 0 12px rgba(0,0,0,0.02);
  z-index: 5;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
`;

const ScrollableChatContent = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-bottom: 40px;
`;

const BottomBar = styled.div`
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 1rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  gap: 2rem;
  z-index: 8;
`;

const InputContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  max-width: 800px;
`;

const InputWrapper = styled.div`
  width: 100%;
  position: relative;
  background: white;
  border-radius: 16px;
  padding: 8px;
  display: flex;
  gap: 10px;
  align-items: flex-end;
  border: 1px solid ${props => props.isTestMode ? '#faad14' : '#d9d9d9'};
  transition: all 0.2s;

  &:focus-within {
    background: white;
    border-color: ${props => props.isTestMode ? '#faad14' : '#1890ff'};
    box-shadow: ${props => props.isTestMode ? '0 0 0 2px rgba(250, 173, 20, 0.1)' : '0 0 0 2px rgba(24, 144, 255, 0.1)'};
  }
`;

const StyledTextArea = styled(TextArea)`
  && {
    border: none;
    background: transparent;
    resize: none;
    box-shadow: none;
    padding: 8px 12px;
    font-size: 15px;
    line-height: 1.5;
    
    &:focus {
      box-shadow: none;
    }
  }
`;

const SummaryCard = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0;
`;

const ResultConsole = styled.div`
  background: #1a1b1e;
  color: #a5b3ce;
  padding: 1rem;
  border-radius: 12px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  height: 250px;
  overflow-y: auto;
  border: 1px solid #2c2e33;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #1a1b1e; }
  &::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
`;

const LogItem = styled.div`
  padding: 4px 0;
  border-bottom: 1px solid #2c2e33;
  display: flex;
  gap: 8px;
  &:last-child { border-bottom: none; }
  color: ${props => props.type === 'error' ? '#ff6b6b' : props.type === 'success' ? '#51cf66' : props.type === 'warning' ? '#fcc419' : '#a5b3ce'};
  word-break: break-all;
`;

const CodeEditor = styled(TextArea)`
  && {
    font-family: 'Menlo', 'Monaco', monospace;
    font-size: 11px;
    background: #fafafa;
    border-radius: 12px;
    padding: 1rem;
    line-height: 1.5;
    border: 1px solid #e0e0e0;
  }
`;

const Tag = styled.span`
  background: #e6f7ff;
  color: #1890ff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
`;

const ActionPanel = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
`;

const CanvasHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 1rem;
`;

// --- NEW COMPONENT: BusinessInfoCard (Extracted) ---
const BusinessInfoCard = ({ data, success }) => {
  if (!data?.business) return null;

  return (
    <SummaryCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, background: '#e6f7ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FontAwesomeIcon icon={faShop} style={{ color: '#1890ff', fontSize: 18 }} />
          </div>
          <div>
            <Text strong style={{ fontSize: 16, display: 'block' }}>{data.business?.name || 'Sin nombre'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{data.business?.address || 'Sin dirección'}</Text>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>USUARIOS ({data.users?.length || 0})</Text>
          {data.users?.map((user, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #fafafa' }}>
              <div style={{ width: 28, height: 28, background: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesomeIcon icon={faUser} style={{ color: '#999', fontSize: 12 }} />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, display: 'block' }}>{user.name}</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>{user.email}</Text>
              </div>
              <Tag style={{ fontSize: 10 }}>{user.role || 'Usuario'}</Tag>
            </div>
          ))}
        </div>

        {success && data.createdBusinessId && (
          <div style={{ background: '#f6ffed', padding: 12, borderRadius: 8, border: '1px solid #b7eb8f' }}>
            <Text style={{ fontSize: 11, color: '#52c41a', display: 'block' }}>
              <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: 6 }} />
              Negocio creado exitosamente
            </Text>
            <Text code style={{ fontSize: 11 }}>{data.createdBusinessId}</Text>
          </div>
        )}
      </div>
    </SummaryCard>
  );
};

const AiBusinessSeeding = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null); 
  const [actionData, setActionData] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isCanvasEnabled, setIsCanvasEnabled] = useState(true); // New State
  const [enabledActions, setEnabledActions] = useState(Object.keys(ACTIONS));
  const [executionSuccess, setExecutionSuccess] = useState(false);

  // Canvas se muestra automáticamente solo cuando hay datos estructurados (no chat) Y está habilitado
  const showCanvas = isCanvasEnabled && activeAction && activeAction !== 'chat' && actionData;

  const logEndRef = useRef(null);
  const contentEndRef = useRef(null);
  const navigate = useNavigate();

  const addLog = (msg, type = 'info') => {
    setLogs((prev) => [...prev, { 
      msg: `[${new Date().toLocaleTimeString()}] ${msg}`, 
      type 
    }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (activeAction || executionSuccess) {
       contentEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeAction, executionSuccess]);

  const handleModeSwitch = (checked) => {
    setIsAdvanced(checked);
    if (!checked) setIsTestMode(false);
    else setIsTestMode(true);
  };

  const handleToggleAction = (actionId) => {
      setEnabledActions(prev => 
          prev.includes(actionId) 
            ? prev.filter(id => id !== actionId) 
            : [...prev, actionId]
      );
  };

  const handleClear = () => {
      setPrompt('');
      setActiveAction(null);
      setActionData(null);
      setExecutionSuccess(false);
      setLogs([]);
  };

  const handleAnalyze = async () => {
    if (!prompt) {
      message.error('Escribe algo primero');
      return;
    }

    setLoading(true);
    setExecutionSuccess(false);
    setActiveAction(null);
    setActionData(null);
    setLogs([]); 
    addLog('🤖 Analizando con Gemini AI...', 'info');

    try {
      const systemPrompt = getSystemPrompt(enabledActions);
      const result = await generativeModel.generateContent([systemPrompt, prompt]);
      const response = await result.response;
      let text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
         // Fallback if JSON is not returned (should rarely happen with strict prompt)
         addLog('❌ No se detectó una acción válida', 'error');
         message.error('No entendí la solicitud');
         setLoading(false);
         return;
      }

      try {
         const parsed = JSON.parse(jsonMatch[0]);
         const actionId = parsed.action;
         const data = parsed.data;

         if (ACTIONS[actionId]) {
             setActiveAction(actionId);
             setActionData(data);
             setPrompt('');
             addLog(`✅ Acción detectada: ${ACTIONS[actionId].name}`, 'success');
         } else {
             addLog(`⚠️ Acción desconocida: ${actionId}`, 'warning');
         }

      } catch (e) {
         console.error(e);
         addLog(`❌ Error parseando respuesta`, 'error');
      }

    } catch (error) {
      console.error(error);
      addLog(`❌ Error: ${error.message}`, 'error');
      message.error('Error al analizar');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!activeAction || !actionData) return;
    
    const action = ACTIONS[activeAction];
    setLoading(true);
    addLog(`▶️ Ejecutando: ${action.name}`, 'info');

    try {
        const resultData = await action.execute(actionData, { addLog, isTestMode });
        setActionData(resultData); // Update data with results (e.g. created IDs)
        setExecutionSuccess(true);
        addLog('✨ Finalizado', 'success');
        if (isAdvanced) message.success('Listo!');
    } catch (error) {
        console.error(error);
        addLog(`🔥 Error: ${error.message}`, 'error');
        message.error('Falló la ejecución');
    } finally {
        setLoading(false);
    }
  };

  const renderActiveContent = () => {
      if (!activeAction) return null;
      const action = ACTIONS[activeAction];
      const Preview = action.PreviewComponent;
      const Result = action.ResultComponent;

      if (executionSuccess && Result) {
          return <Result data={actionData} onReset={handleClear} />;
      }

      if (Preview) {
          return <Preview 
            data={actionData} 
            onExecute={handleExecute} 
            loading={loading}
            isTestMode={isTestMode}
          />;
      }

      return null;
  };

  const menuItems = [
    {
      key: '1',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', minWidth: 120 }} onClick={(e) => e.stopPropagation()}>
           <Text style={{ fontSize: 12 }}>Avanzado</Text>
           <Switch size="small" checked={isAdvanced} onChange={handleModeSwitch} />
        </div>
      ),
    },
    {
      key: 'panel-toggle',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', minWidth: 120 }} onClick={(e) => e.stopPropagation()}>
           <Text style={{ fontSize: 12 }}>Panel Lateral</Text>
           <Switch size="small" checked={isCanvasEnabled} onChange={setIsCanvasEnabled} />
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', minWidth: 120 }} onClick={(e) => e.stopPropagation()}>
           <Text style={{ fontSize: 12 }}>Modo Prueba</Text>
           <Switch size="small" checked={isTestMode} onChange={setIsTestMode} />
        </div>
      ),
    },
    {
       type: 'divider',
    },
    {
        key: 'header-skills',
        label: <Text type="secondary" style={{ fontSize: 10, fontWeight: 'bold' }}>HABILIDADES</Text>,
        disabled: true,
    },
    ...Object.values(ACTIONS).map((action, index) => ({
        key: `action-${action.id}`,
        label: (
            <div 
                style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', minWidth: 150, cursor: 'pointer' }} 
                onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleAction(action.id);
                }}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <Text style={{ fontSize: 12 }}>{action.name}</Text>
                <Switch 
                    size="small" 
                    checked={enabledActions.includes(action.id)} 
                    style={{ pointerEvents: 'none' }}
                />
            </div>
        )
    }))
  ];

  return (
    <AppContainer>
      <Header>
        <div style={{ justifySelf: 'start' }}>
            <Button onClick={() => navigate('/home')} icon={<FontAwesomeIcon icon={faHome} />} />
        </div>
        <HeaderTitle>
            <span style={{ color: 'var(--color-primary)' }}>Ventamax</span>
        </HeaderTitle>
        <div />
      </Header>

      <Workspace>
          {/* --- CHAT COLUMN (CENTER) --- */}
          <ChatColumn>
              <ScrollableChatContent>
                  <ContentWrapper>
                      {!activeAction && (
                          <div style={{ textAlign: 'center', marginTop: '4rem', opacity: 0.5 }}>
                              <FontAwesomeIcon icon={faRobot} style={{ fontSize: '64px', color: '#ccc', marginBottom: '1rem' }} />
                              <Title level={3} style={{ color: '#999' }}>¿En qué puedo ayudarte hoy?</Title>
                              <Text type="secondary">Gestionar negocios, consultas generales, y más.</Text>
                          </div>
                      )}

                      {/* Dynamic Action Rendering (Previews/Cards) */}
                      {renderActiveContent()}

                      {/* Si el Panel Lateral está OCULTO y tenemos datos de negocio, mostramos la tarjeta aquí en el chat */}
                      {!showCanvas && activeAction === 'createBusiness' && actionData && (
                         <div style={{ marginTop: 20 }}>
                           <BusinessInfoCard data={actionData} success={executionSuccess} />
                         </div>
                      )}

                      <div ref={contentEndRef} />
                  </ContentWrapper>
              </ScrollableChatContent>

              <BottomBar>
                  <InputContainer>
                      <InputWrapper isTestMode={isTestMode}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                              <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="topRight">
                                  <Button 
                                      type="text" 
                                      icon={<FontAwesomeIcon icon={faEllipsisV} />} 
                                      style={{ color: '#999' }}
                                  />
                              </Dropdown>
                          </div>
                          <StyledTextArea 
                              placeholder="Escribe tu solicitud..."
                              autoSize={{ minRows: 1, maxRows: 6 }}
                              value={prompt}
                              onChange={(e) => setPrompt(e.target.value)}
                              onPressEnter={(e) => {
                                  if (!e.shiftKey && prompt) {
                                      e.preventDefault();
                                      handleAnalyze();
                                  }
                              }}
                          />
                          <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
                              <Button 
                                  type="text" 
                                  icon={<FontAwesomeIcon icon={faTimes} />} 
                                  onClick={handleClear} 
                                  disabled={!prompt}
                                  style={{ color: '#999' }}
                              />
                              <Button 
                                  type="primary" 
                                  shape="circle" 
                                  icon={<FontAwesomeIcon icon={faPaperPlane} />} 
                                  onClick={handleAnalyze}
                                  loading={loading}
                                  disabled={!prompt}
                              />
                          </div>
                      </InputWrapper>
                  </InputContainer>
              </BottomBar>
          </ChatColumn>

          {/* --- CANVAS COLUMN (RIGHT) - Solo para datos estructurados, no chat --- */}
          {showCanvas && (
              <CanvasColumn>
                  <CanvasHeader>
                       <Title level={5} style={{ margin: 0 }}>
                         <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: 8 }} />
                         {ACTIONS[activeAction]?.name || 'Datos'}
                       </Title>
                       {isTestMode && <Tag style={{ background: '#fff7e6', color: '#fa8c16' }}>TEST MODE</Tag>}
                       {executionSuccess && <Tag style={{ background: '#f6ffed', color: '#52c41a' }}>CREADO</Tag>}
                  </CanvasHeader>

                  {/* RESUMEN FRIENDLY - Datos del negocio (Ahora usa el componente reutilizable) */}
                  {activeAction === 'createBusiness' && (
                      <BusinessInfoCard data={actionData} success={executionSuccess} />
                  )}

                  {/* RAW DATA y LOGS - Solo en modo Avanzado */}
                  {isAdvanced && (
                      <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <Text strong style={{ fontSize: 12 }}>RAW DATA</Text>
                              <CodeEditor 
                                  rows={8} 
                                  value={JSON.stringify(actionData, null, 2)} 
                                  onChange={(e) => {
                                      try {
                                          setActionData(JSON.parse(e.target.value));
                                      } catch (err) { /* ignore while typing */ }
                                  }} 
                              />
                              <Button 
                                  type={isTestMode ? "default" : "primary"} 
                                  danger={!isTestMode}
                                  icon={<FontAwesomeIcon icon={isTestMode ? faCheckCircle : faBolt} />} 
                                  onClick={handleExecute} 
                                  loading={loading}
                                  block
                                  disabled={executionSuccess}
                              >
                                  {isTestMode ? 'Simular Ejecución' : 'Ejecutar Real'}
                              </Button>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <Text strong style={{ fontSize: 12, marginBottom: '10px' }}>SYSTEM LOGS</Text>
                              <ResultConsole>
                                  {logs.length === 0 && (
                                      <LogItem type="info"><span style={{ opacity: 0.5 }}>Esperando actividad...</span></LogItem>
                                  )}
                                  {logs.map((log, i) => (
                                      <LogItem key={i} type={log.type}>
                                          <span style={{ opacity: 0.5 }}>{log.msg.split(']')[0]}]</span>
                                          <span>{log.msg.split(']')[1]}</span>
                                      </LogItem>
                                  ))}
                                  <div ref={logEndRef} />
                              </ResultConsole>
                          </div>
                      </>
                  )}
              </CanvasColumn>
          )}
      </Workspace>
    </AppContainer>
  );
};

export default AiBusinessSeeding;