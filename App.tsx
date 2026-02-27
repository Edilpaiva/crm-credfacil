import { useState, useEffect } from 'react';
export {};

const C = {
  laranja: '#F97316',
  azul: '#1E40AF',
  azulClaro: '#3B82F6',
  fundo: '#0F172A',
  card: '#1E293B',
  borda: '#334155',
  texto: '#F1F5F9',
  textoSecundario: '#94A3B8',
  verde: '#22C55E',
  vermelho: '#EF4444',
  amarelo: '#F59E0B',
};

const BANCOS = ['Facta', 'Pan', 'BMG', 'C6', 'Happy'];
const PRAZOS = [48, 60, 72, 84, 96];

const TABELAS_PADRAO = [
  { banco: 'Facta', prazo: 48, coef: 0.03055 },
  { banco: 'Facta', prazo: 60, coef: 0.02607 },
  { banco: 'Facta', prazo: 72, coef: 0.02311 },
  { banco: 'Facta', prazo: 84, coef: 0.021 },
  { banco: 'Facta', prazo: 96, coef: 0.0195 },
  { banco: 'Pan', prazo: 48, coef: 0.03075 },
  { banco: 'Pan', prazo: 60, coef: 0.0263 },
  { banco: 'Pan', prazo: 72, coef: 0.02345 },
  { banco: 'Pan', prazo: 84, coef: 0.0213 },
  { banco: 'Pan', prazo: 96, coef: 0.0198 },
  { banco: 'BMG', prazo: 48, coef: 0.0302 },
  { banco: 'BMG', prazo: 60, coef: 0.0258 },
  { banco: 'BMG', prazo: 72, coef: 0.02285 },
  { banco: 'BMG', prazo: 84, coef: 0.02075 },
  { banco: 'BMG', prazo: 96, coef: 0.0192 },
  { banco: 'C6', prazo: 48, coef: 0.0306 },
  { banco: 'C6', prazo: 60, coef: 0.02615 },
  { banco: 'C6', prazo: 72, coef: 0.0232 },
  { banco: 'C6', prazo: 84, coef: 0.0211 },
  { banco: 'C6', prazo: 96, coef: 0.0196 },
  { banco: 'Happy', prazo: 48, coef: 0.0308 },
  { banco: 'Happy', prazo: 60, coef: 0.0264 },
  { banco: 'Happy', prazo: 72, coef: 0.02355 },
  { banco: 'Happy', prazo: 84, coef: 0.0214 },
  { banco: 'Happy', prazo: 96, coef: 0.0199 },
];

const STATUS_COLORS = {
  'Novo Lead': '#3B82F6',
  'Em Contato': '#F59E0B',
  'Simulação Enviada': '#F97316',
  'Proposta Digitada': '#A855F7',
  Aprovado: '#22C55E',
  Reprovado: '#EF4444',
  Portabilidade: '#06B6D4',
};

const fmt = (v) =>
  (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtCPF = (v) =>
  v?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') ?? '';

export default function CRM() {
  const [aba, setAba] = useState('dashboard');
  const [clientes, setClientes] = useState([]);
  const [propostas, setPropostas] = useState([]);
  const [tabelas, setTabelas] = useState(TABELAS_PADRAO);
  const [tabelasTemp, setTabelasTemp] = useState([]);
  const [editandoCoef, setEditandoCoef] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [simulacao, setSimulacao] = useState(null);
  const [form, setForm] = useState({});
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [bancosFiltro, setBancosFiltro] = useState(BANCOS);
  const [notif, setNotif] = useState(null);
  const [margemAvulsa, setMargemAvulsa] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const c = await window.storage.get('crm_clientes');
        const p = await window.storage.get('crm_propostas');
        const t = await window.storage.get('crm_tabelas');
        if (c) setClientes(JSON.parse(c.value));
        if (p) setPropostas(JSON.parse(p.value));
        if (t) setTabelas(JSON.parse(t.value));
      } catch (e) {}
      setLoading(false);
    })();
  }, []);

  const toast = (msg, tipo = 'ok') => {
    setNotif({ msg, tipo });
    setTimeout(() => setNotif(null), 3000);
  };

  const abrirEdicao = () => {
    setTabelasTemp(JSON.parse(JSON.stringify(tabelas)));
    setEditandoCoef(true);
    setAba('tabelas');
  };

  const salvarCoef = async () => {
    setTabelas(tabelasTemp);
    await window.storage.set('crm_tabelas', JSON.stringify(tabelasTemp));
    setEditandoCoef(false);
    toast('✅ Coeficientes salvos!');
  };

  const getCoefTemp = (banco, prazo) =>
    tabelasTemp.find((t) => t.banco === banco && t.prazo === prazo)?.coef ?? 0;

  const setCoefTemp = (banco, prazo, val) =>
    setTabelasTemp((prev) =>
      prev.map((t) =>
        t.banco === banco && t.prazo === prazo
          ? { ...t, coef: parseFloat(val) || 0 }
          : t
      )
    );

  const getCoef = (banco, prazo) =>
    tabelas.find((t) => t.banco === banco && t.prazo === prazo)?.coef ?? 0;

  const salvarCliente = async () => {
    if (!form.nome || !form.cpf || !form.margem) {
      toast('Preencha nome, CPF e margem!', 'erro');
      return;
    }
    let novos;
    if (form.id) {
      novos = clientes.map((c) => (c.id === form.id ? { ...c, ...form } : c));
    } else {
      novos = [
        ...clientes,
        {
          ...form,
          id: Date.now(),
          status: 'Novo Lead',
          dataCadastro: new Date().toLocaleDateString('pt-BR'),
          historico: [],
        },
      ];
    }
    setClientes(novos);
    await window.storage.set('crm_clientes', JSON.stringify(novos));
    setModal(null);
    setForm({});
    toast(form.id ? 'Cliente atualizado!' : 'Cliente cadastrado!');
  };

  const mudarStatus = async (id, status) => {
    const novos = clientes.map((c) =>
      c.id === id
        ? {
            ...c,
            status,
            historico: [
              ...(c.historico || []),
              {
                status,
                data: new Date().toLocaleDateString('pt-BR'),
                hora: new Date().toLocaleTimeString('pt-BR'),
              },
            ],
          }
        : c
    );
    setClientes(novos);
    await window.storage.set('crm_clientes', JSON.stringify(novos));
    toast('Status atualizado!');
  };

  const excluir = async (id) => {
    const novos = clientes.filter((c) => c.id !== id);
    setClientes(novos);
    await window.storage.set('crm_clientes', JSON.stringify(novos));
    setClienteSelecionado(null);
    toast('Cliente removido.');
  };

  const simular = (cliente) => {
    const m = parseFloat(cliente.margem);
    const resultados = tabelas
      .filter((t) => bancosFiltro.includes(t.banco))
      .map((t) => ({ ...t, valor: t.coef > 0 ? m / t.coef : 0 }));
    setSimulacao({ cliente, resultados });
    setModal('sim');
  };

  const digitarProposta = async (cliente, banco, prazo, valor) => {
    const nova = {
      id: Date.now(),
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      clienteCPF: cliente.cpf,
      banco,
      prazo,
      valorEmprestimo: valor,
      parcela: parseFloat(cliente.margem),
      status: 'Digitada',
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR'),
    };
    const novas = [...propostas, nova];
    setPropostas(novas);
    await window.storage.set('crm_propostas', JSON.stringify(novas));
    await mudarStatus(cliente.id, 'Proposta Digitada');
    setModal(null);
    setSimulacao(null);
    toast(`Proposta ${banco} ${prazo}x digitada!`);
  };

  const clientesFiltrados = clientes.filter((c) => {
    const ok = filtroStatus === 'Todos' || c.status === filtroStatus;
    const q = busca.toLowerCase();
    return (
      ok &&
      (c.nome?.toLowerCase().includes(q) ||
        c.cpf?.includes(q) ||
        c.telefone?.includes(q))
    );
  });

  const inp = {
    background: C.fundo,
    border: `1px solid ${C.borda}`,
    color: C.texto,
    padding: '9px 12px',
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const btn = (bg, extra = {}) => ({
    background: bg,
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 8,
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
    ...extra,
  });

  if (loading)
    return (
      <div
        style={{
          background: C.fundo,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.laranja,
          fontSize: 18,
        }}
      >
        Carregando CRM...
      </div>
    );

  return (
    <div
      style={{
        background: C.fundo,
        minHeight: '100vh',
        fontFamily: "'Segoe UI', sans-serif",
        color: C.texto,
      }}
    >
      {notif && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: notif.tipo === 'erro' ? C.vermelho : C.verde,
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {notif.msg}
        </div>
      )}

      {/* SIDEBAR */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 200,
          background: C.card,
          borderRight: `1px solid ${C.borda}`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: '18px 14px 14px',
            borderBottom: `1px solid ${C.borda}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${C.laranja}, ${C.azul})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: 16,
              color: '#fff',
            }}
          >
            G
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: C.laranja }}>
              Global Credfácil
            </div>
            <div style={{ fontSize: 10, color: C.textoSecundario }}>
              CRM Consignado INSS
            </div>
          </div>
        </div>
        <nav style={{ padding: 10, flex: 1 }}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard' },
            { id: 'clientes', icon: '👥', label: 'Clientes' },
            { id: 'propostas', icon: '📋', label: 'Propostas' },
            { id: 'simulador', icon: '🧮', label: 'Simulador' },
            { id: 'tabelas', icon: '⚙️', label: 'Coeficientes' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAba(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                width: '100%',
                padding: '9px 10px',
                borderRadius: 8,
                border: 'none',
                background: aba === item.id ? `${C.laranja}20` : 'transparent',
                color: aba === item.id ? C.laranja : C.textoSecundario,
                cursor: 'pointer',
                fontWeight: aba === item.id ? 700 : 400,
                fontSize: 13,
                marginBottom: 2,
                textAlign: 'left',
                borderLeft:
                  aba === item.id
                    ? `3px solid ${C.laranja}`
                    : '3px solid transparent',
              }}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>
        <div
          style={{
            padding: 12,
            borderTop: `1px solid ${C.borda}`,
            fontSize: 11,
            color: C.textoSecundario,
          }}
        >
          <div>Edil — Global Credfácil</div>
          <div style={{ color: `${C.verde}99`, marginTop: 2 }}>● Online</div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div
        style={{ marginLeft: 200, padding: '24px 28px', minHeight: '100vh' }}
      >
        {/* DASHBOARD */}
        {aba === 'dashboard' &&
          (() => {
            const totalC = clientes.length;
            const aprovados = clientes.filter(
              (c) => c.status === 'Aprovado'
            ).length;
            const valorTotal = propostas.reduce(
              (s, p) => s + (p.valorEmprestimo || 0),
              0
            );
            const comissao = valorTotal * 0.025;
            return (
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  Dashboard
                </h1>
                <p
                  style={{
                    color: C.textoSecundario,
                    marginBottom: 24,
                    fontSize: 13,
                  }}
                >
                  Visão geral da operação
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4,1fr)',
                    gap: 14,
                    marginBottom: 24,
                  }}
                >
                  {[
                    {
                      label: 'Total Clientes',
                      val: totalC,
                      icon: '👥',
                      cor: C.azulClaro,
                    },
                    {
                      label: 'Aprovados',
                      val: aprovados,
                      icon: '✅',
                      cor: C.verde,
                    },
                    {
                      label: 'Propostas',
                      val: propostas.length,
                      icon: '📋',
                      cor: C.laranja,
                    },
                    {
                      label: 'Comissão Est.',
                      val: fmt(comissao),
                      icon: '💰',
                      cor: '#A855F7',
                    },
                  ].map((m, i) => (
                    <div
                      key={i}
                      style={{
                        background: C.card,
                        border: `1px solid ${C.borda}`,
                        borderRadius: 12,
                        padding: 20,
                        borderTop: `3px solid ${m.cor}`,
                      }}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>
                        {m.icon}
                      </div>
                      <div
                        style={{ fontSize: 24, fontWeight: 800, color: m.cor }}
                      >
                        {m.val}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: C.textoSecundario,
                          marginTop: 4,
                        }}
                      >
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.borda}`,
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 16,
                      }}
                    >
                      Leads por Status
                    </h3>
                    {Object.entries(STATUS_COLORS).map(([status, cor]) => {
                      const qtd = clientes.filter(
                        (c) => c.status === status
                      ).length;
                      const pct = totalC > 0 ? (qtd / totalC) * 100 : 0;
                      return (
                        <div key={status} style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                              marginBottom: 3,
                            }}
                          >
                            <span style={{ color: C.textoSecundario }}>
                              {status}
                            </span>
                            <span style={{ fontWeight: 700 }}>{qtd}</span>
                          </div>
                          <div
                            style={{
                              height: 6,
                              background: C.borda,
                              borderRadius: 3,
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: cor,
                                borderRadius: 3,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      background: C.card,
                      border: `1px solid ${C.borda}`,
                      borderRadius: 12,
                      padding: 20,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 16,
                      }}
                    >
                      Últimas Propostas
                    </h3>
                    {propostas.length === 0 && (
                      <div style={{ color: C.textoSecundario, fontSize: 12 }}>
                        Nenhuma proposta ainda.
                      </div>
                    )}
                    {propostas
                      .slice(-5)
                      .reverse()
                      .map((p) => (
                        <div
                          key={p.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '8px 0',
                            borderBottom: `1px solid ${C.borda}`,
                            fontSize: 12,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {p.clienteNome}
                            </div>
                            <div style={{ color: C.textoSecundario }}>
                              {p.banco} — {p.prazo}x
                            </div>
                          </div>
                          <div style={{ color: C.verde, fontWeight: 700 }}>
                            {fmt(p.valorEmprestimo)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            );
          })()}

        {/* CLIENTES */}
        {aba === 'clientes' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  Clientes / Leads
                </h1>
                <p style={{ color: C.textoSecundario, fontSize: 13 }}>
                  {clientesFiltrados.length} de {clientes.length}
                </p>
              </div>
              <button
                onClick={() => {
                  setForm({});
                  setModal('form');
                }}
                style={btn(C.laranja)}
              >
                + Novo Cliente
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              <input
                placeholder="🔍 Buscar nome, CPF, telefone..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ ...inp, width: 280 }}
              />
              {['Todos', ...Object.keys(STATUS_COLORS)].map((s) => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: filtroStatus === s ? C.laranja : C.card,
                    color: filtroStatus === s ? '#fff' : C.textoSecundario,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: filtroStatus === s ? 700 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {clientesFiltrados.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.borda}`,
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    cursor: 'pointer',
                    borderLeft: `4px solid ${
                      STATUS_COLORS[c.status] || C.borda
                    }`,
                  }}
                  onClick={() => setClienteSelecionado(c)}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${C.laranja}, ${C.azul})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 15,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {c.nome?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {c.nome}
                    </div>
                    <div style={{ color: C.textoSecundario, fontSize: 11 }}>
                      {fmtCPF(c.cpf)} · {c.telefone} · NB: {c.beneficio}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{ color: C.verde, fontWeight: 800, fontSize: 15 }}
                    >
                      {fmt(parseFloat(c.margem || 0))}
                    </div>
                    <div style={{ color: C.textoSecundario, fontSize: 10 }}>
                      margem livre
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: `${STATUS_COLORS[c.status]}22`,
                      color: STATUS_COLORS[c.status] || C.textoSecundario,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {c.status}
                  </div>
                  <div
                    style={{ display: 'flex', gap: 6 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => simular(c)}
                      style={btn(C.laranja, {
                        padding: '6px 12px',
                        fontSize: 12,
                      })}
                    >
                      Simular
                    </button>
                    <button
                      onClick={() => {
                        setForm(c);
                        setModal('form');
                      }}
                      style={btn(C.borda, {
                        padding: '6px 12px',
                        fontSize: 12,
                      })}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
              {clientesFiltrados.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 60,
                    color: C.textoSecundario,
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                  <div style={{ fontSize: 15, marginBottom: 16 }}>
                    Nenhum cliente encontrado
                  </div>
                  <button
                    onClick={() => {
                      setForm({});
                      setModal('form');
                    }}
                    style={btn(C.laranja)}
                  >
                    Cadastrar primeiro cliente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROPOSTAS */}
        {aba === 'propostas' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              Propostas
            </h1>
            <p
              style={{
                color: C.textoSecundario,
                marginBottom: 20,
                fontSize: 13,
              }}
            >
              {propostas.length} proposta(s)
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {propostas
                .slice()
                .reverse()
                .map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.borda}`,
                      borderRadius: 12,
                      padding: 18,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 18,
                    }}
                  >
                    <div style={{ fontSize: 28 }}>📋</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {p.clienteNome}
                      </div>
                      <div style={{ color: C.textoSecundario, fontSize: 12 }}>
                        CPF: {fmtCPF(p.clienteCPF)} · {p.banco} · {p.prazo}x
                      </div>
                      <div style={{ color: C.textoSecundario, fontSize: 11 }}>
                        {p.data} às {p.hora}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          color: C.verde,
                          fontWeight: 800,
                          fontSize: 17,
                        }}
                      >
                        {fmt(p.valorEmprestimo)}
                      </div>
                      <div style={{ color: C.textoSecundario, fontSize: 12 }}>
                        parcela: {fmt(p.parcela)}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '5px 14px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: `${C.azulClaro}20`,
                        color: C.azulClaro,
                      }}
                    >
                      {p.status}
                    </div>
                  </div>
                ))}
              {propostas.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 60,
                    color: C.textoSecundario,
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div>
                    Nenhuma proposta ainda. Simule um cliente para começar!
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SIMULADOR AVULSO */}
        {aba === 'simulador' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              Simulador Avulso
            </h1>
            <p
              style={{
                color: C.textoSecundario,
                marginBottom: 24,
                fontSize: 13,
              }}
            >
              Simule rapidamente sem cadastrar cliente
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div
                style={{
                  background: C.card,
                  border: `1px solid ${C.borda}`,
                  borderRadius: 12,
                  padding: 22,
                  minWidth: 260,
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: C.textoSecundario,
                      marginBottom: 6,
                    }}
                  >
                    Margem Livre (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 350.00"
                    value={margemAvulsa}
                    onChange={(e) => setMargemAvulsa(e.target.value)}
                    style={inp}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: C.textoSecundario,
                      marginBottom: 8,
                    }}
                  >
                    Bancos
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {BANCOS.map((b) => (
                      <button
                        key={b}
                        onClick={() =>
                          setBancosFiltro((p) =>
                            p.includes(b) ? p.filter((x) => x !== b) : [...p, b]
                          )
                        }
                        style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          border: 'none',
                          background: bancosFiltro.includes(b)
                            ? C.laranja
                            : C.borda,
                          color: bancosFiltro.includes(b)
                            ? '#fff'
                            : C.textoSecundario,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!margemAvulsa)
                      return toast('Informe a margem!', 'erro');
                    const m = parseFloat(margemAvulsa);
                    const resultados = tabelas
                      .filter((t) => bancosFiltro.includes(t.banco))
                      .map((t) => ({
                        ...t,
                        valor: t.coef > 0 ? m / t.coef : 0,
                      }));
                    setSimulacao({
                      cliente: { nome: 'Avulsa', margem: m },
                      resultados,
                    });
                  }}
                  style={{
                    ...btn(C.laranja),
                    width: '100%',
                    padding: '12px',
                    fontSize: 14,
                  }}
                >
                  🧮 Calcular
                </button>
              </div>
              {simulacao && aba === 'simulador' && (
                <div
                  style={{
                    flex: 1,
                    background: C.card,
                    border: `1px solid ${C.borda}`,
                    borderRadius: 12,
                    padding: 22,
                    minWidth: 300,
                    overflowX: 'auto',
                  }}
                >
                  <h3 style={{ marginBottom: 16, fontSize: 14 }}>
                    Margem:{' '}
                    <span style={{ color: C.verde }}>
                      {fmt(parseFloat(simulacao.cliente.margem))}
                    </span>
                  </h3>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '8px 10px',
                            color: C.textoSecundario,
                            borderBottom: `1px solid ${C.borda}`,
                          }}
                        >
                          Banco
                        </th>
                        {PRAZOS.map((p) => (
                          <th
                            key={p}
                            style={{
                              textAlign: 'center',
                              padding: '8px 10px',
                              color: C.textoSecundario,
                              borderBottom: `1px solid ${C.borda}`,
                            }}
                          >
                            {p}x
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bancosFiltro.map((banco) => (
                        <tr key={banco}>
                          <td
                            style={{
                              padding: '10px 10px',
                              fontWeight: 700,
                              color: C.laranja,
                            }}
                          >
                            {banco}
                          </td>
                          {PRAZOS.map((prazo) => {
                            const r = simulacao.resultados.find(
                              (x) => x.banco === banco && x.prazo === prazo
                            );
                            return (
                              <td
                                key={prazo}
                                style={{
                                  padding: '10px 10px',
                                  textAlign: 'center',
                                  color: C.verde,
                                  fontWeight: 600,
                                }}
                              >
                                {r?.valor > 0 ? fmt(r.valor) : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COEFICIENTES */}
        {aba === 'tabelas' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                  ⚙️ Coeficientes por Banco
                </h1>
                <p style={{ color: C.textoSecundario, fontSize: 13 }}>
                  {editandoCoef
                    ? '✏️ Modo edição — altere os campos e clique em Salvar'
                    : 'Clique em Editar para atualizar manualmente'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {editandoCoef ? (
                  <>
                    <button onClick={salvarCoef} style={btn(C.verde)}>
                      💾 Salvar
                    </button>
                    <button
                      onClick={() => setEditandoCoef(false)}
                      style={btn(C.borda)}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button onClick={abrirEdicao} style={btn(C.laranja)}>
                    ✏️ Editar Coeficientes
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                background: `${C.azulClaro}12`,
                border: `1px solid ${C.azulClaro}35`,
                borderRadius: 10,
                padding: 14,
                marginBottom: 20,
                fontSize: 13,
                display: 'flex',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>💡</span>
              <div style={{ color: C.textoSecundario }}>
                <strong style={{ color: C.azulClaro }}>
                  Atualização manual:
                </strong>{' '}
                Quando receber a tabela atualizada do banco, clique em{' '}
                <em>Editar Coeficientes</em>, altere os valores e salve. Após
                integrar a API da Facta, isso será automático.
              </div>
            </div>

            {BANCOS.map((banco) => (
              <div
                key={banco}
                style={{
                  background: C.card,
                  border: `1px solid ${C.borda}`,
                  borderRadius: 12,
                  padding: 18,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <span
                    style={{
                      background: `${C.laranja}20`,
                      color: C.laranja,
                      padding: '3px 12px',
                      borderRadius: 20,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    🏦 {banco}
                  </span>
                  {editandoCoef && (
                    <span style={{ fontSize: 11, color: C.amarelo }}>
                      ✏️ editando
                    </span>
                  )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: 'left',
                            padding: '7px 12px',
                            color: C.textoSecundario,
                            fontSize: 12,
                            borderBottom: `1px solid ${C.borda}`,
                          }}
                        >
                          Prazo
                        </th>
                        <th
                          style={{
                            textAlign: 'center',
                            padding: '7px 12px',
                            color: C.textoSecundario,
                            fontSize: 12,
                            borderBottom: `1px solid ${C.borda}`,
                          }}
                        >
                          Coeficiente
                        </th>
                        <th
                          style={{
                            textAlign: 'center',
                            padding: '7px 12px',
                            color: C.textoSecundario,
                            fontSize: 12,
                            borderBottom: `1px solid ${C.borda}`,
                          }}
                        >
                          R$ 300
                        </th>
                        <th
                          style={{
                            textAlign: 'center',
                            padding: '7px 12px',
                            color: C.textoSecundario,
                            fontSize: 12,
                            borderBottom: `1px solid ${C.borda}`,
                          }}
                        >
                          R$ 500
                        </th>
                        <th
                          style={{
                            textAlign: 'center',
                            padding: '7px 12px',
                            color: C.textoSecundario,
                            fontSize: 12,
                            borderBottom: `1px solid ${C.borda}`,
                          }}
                        >
                          R$ 800
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {PRAZOS.map((prazo) => {
                        const coef = editandoCoef
                          ? getCoefTemp(banco, prazo)
                          : getCoef(banco, prazo);
                        return (
                          <tr
                            key={prazo}
                            style={{ borderBottom: `1px solid ${C.borda}25` }}
                          >
                            <td style={{ padding: '9px 12px' }}>
                              <span
                                style={{
                                  background: `${C.azulClaro}20`,
                                  color: C.azulClaro,
                                  padding: '2px 10px',
                                  borderRadius: 12,
                                  fontSize: 12,
                                }}
                              >
                                {prazo} meses
                              </span>
                            </td>
                            <td
                              style={{
                                padding: '9px 12px',
                                textAlign: 'center',
                              }}
                            >
                              {editandoCoef ? (
                                <input
                                  type="number"
                                  step="0.00001"
                                  value={getCoefTemp(banco, prazo)}
                                  onChange={(e) =>
                                    setCoefTemp(banco, prazo, e.target.value)
                                  }
                                  style={{
                                    background: `${C.amarelo}15`,
                                    border: `1px solid ${C.amarelo}55`,
                                    color: C.texto,
                                    padding: '5px 8px',
                                    borderRadius: 6,
                                    fontSize: 13,
                                    width: 105,
                                    textAlign: 'center',
                                    outline: 'none',
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    color: C.amarelo,
                                    fontWeight: 700,
                                  }}
                                >
                                  {coef.toFixed(5)}
                                </span>
                              )}
                            </td>
                            {[300, 500, 800].map((m) => (
                              <td
                                key={m}
                                style={{
                                  padding: '9px 12px',
                                  textAlign: 'center',
                                  color: C.verde,
                                  fontWeight: 600,
                                  fontSize: 13,
                                }}
                              >
                                {coef > 0 ? fmt(m / coef) : '—'}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETALHE CLIENTE */}
      {clienteSelecionado && !modal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
          onClick={() => setClienteSelecionado(null)}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.borda}`,
              borderRadius: 16,
              padding: 26,
              width: 530,
              maxHeight: '82vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                  {clienteSelecionado.nome}
                </h2>
                <div style={{ color: C.textoSecundario, fontSize: 12 }}>
                  {fmtCPF(clienteSelecionado.cpf)}
                </div>
              </div>
              <button
                onClick={() => setClienteSelecionado(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.textoSecundario,
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 18,
              }}
            >
              {[
                ['Telefone', clienteSelecionado.telefone],
                ['NB/Matrícula', clienteSelecionado.beneficio],
                ['Espécie', clienteSelecionado.especie],
                [
                  'Valor Benefício',
                  fmt(parseFloat(clienteSelecionado.valorBeneficio || 0)),
                ],
                [
                  'Margem Livre',
                  fmt(parseFloat(clienteSelecionado.margem || 0)),
                ],
                ['Banco Atual', clienteSelecionado.bancoAtual || '—'],
                ['Cadastro', clienteSelecionado.dataCadastro],
                ['Obs.', clienteSelecionado.obs || '—'],
              ].map(([lbl, val]) => (
                <div
                  key={lbl}
                  style={{ background: C.fundo, borderRadius: 8, padding: 10 }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: C.textoSecundario,
                      marginBottom: 3,
                    }}
                  >
                    {lbl}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 12,
                  color: C.textoSecundario,
                  marginBottom: 8,
                }}
              >
                Atualizar Status
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(STATUS_COLORS).map(([s, cor]) => (
                  <button
                    key={s}
                    onClick={() => {
                      mudarStatus(clienteSelecionado.id, s);
                      setClienteSelecionado({
                        ...clienteSelecionado,
                        status: s,
                      });
                    }}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 20,
                      border: `1px solid ${cor}`,
                      background:
                        clienteSelecionado.status === s ? cor : 'transparent',
                      color: clienteSelecionado.status === s ? '#fff' : cor,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {clienteSelecionado.historico?.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: C.textoSecundario,
                    marginBottom: 8,
                  }}
                >
                  Histórico
                </div>
                {clienteSelecionado.historico
                  .slice()
                  .reverse()
                  .map((h, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 12,
                        fontSize: 12,
                        padding: '5px 0',
                        borderBottom: `1px solid ${C.borda}`,
                      }}
                    >
                      <span style={{ color: C.textoSecundario }}>
                        {h.data} {h.hora}
                      </span>
                      <span
                        style={{ color: STATUS_COLORS[h.status] || C.texto }}
                      >
                        {h.status}
                      </span>
                    </div>
                  ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => simular(clienteSelecionado)}
                style={{ ...btn(C.laranja), flex: 1, padding: '12px' }}
              >
                🧮 Simular
              </button>
              <button
                onClick={() => excluir(clienteSelecionado.id)}
                style={{
                  background: `${C.vermelho}15`,
                  color: C.vermelho,
                  border: `1px solid ${C.vermelho}`,
                  padding: '12px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM CLIENTE */}
      {modal === 'form' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.borda}`,
              borderRadius: 16,
              padding: 26,
              width: 540,
              maxHeight: '85vh',
              overflow: 'auto',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {form.id ? 'Editar Cliente' : 'Novo Cliente / Lead'}
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              {[
                {
                  key: 'nome',
                  label: 'Nome Completo *',
                  placeholder: 'João Silva',
                  full: true,
                },
                { key: 'cpf', label: 'CPF *', placeholder: '00000000000' },
                {
                  key: 'telefone',
                  label: 'Telefone / WhatsApp',
                  placeholder: '(34) 99999-9999',
                },
                {
                  key: 'beneficio',
                  label: 'Nº Benefício (NB) *',
                  placeholder: '1234567890',
                },
                {
                  key: 'especie',
                  label: 'Espécie',
                  placeholder: 'Ex: 42 - Apos.',
                },
                {
                  key: 'valorBeneficio',
                  label: 'Valor do Benefício (R$)',
                  placeholder: '1518.00',
                  type: 'number',
                },
                {
                  key: 'margem',
                  label: 'Margem Livre (R$) *',
                  placeholder: '350.00',
                  type: 'number',
                },
                {
                  key: 'bancoAtual',
                  label: 'Banco Atual',
                  placeholder: 'Pan, BMG...',
                },
                {
                  key: 'obs',
                  label: 'Observações',
                  placeholder: 'Anotações',
                  full: true,
                },
              ].map((f) => (
                <div
                  key={f.key}
                  style={{ gridColumn: f.full ? '1 / -1' : 'auto' }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: C.textoSecundario,
                      marginBottom: 5,
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key] || ''}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    style={inp}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={salvarCliente}
                style={{
                  ...btn(C.laranja),
                  flex: 1,
                  padding: '12px',
                  fontSize: 14,
                }}
              >
                {form.id ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
              <button
                onClick={() => {
                  setModal(null);
                  setForm({});
                }}
                style={btn(C.borda, { padding: '12px 18px' })}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SIMULADOR */}
      {modal === 'sim' && simulacao && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.borda}`,
              borderRadius: 16,
              padding: 26,
              width: 820,
              maxHeight: '85vh',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>
                  Simulação — {simulacao.cliente.nome}
                </h2>
                <p style={{ color: C.textoSecundario, fontSize: 13 }}>
                  Margem:{' '}
                  <span style={{ color: C.verde, fontWeight: 700 }}>
                    {fmt(parseFloat(simulacao.cliente.margem))}
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setModal(null);
                  setSimulacao(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.textoSecundario,
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: C.textoSecundario,
                  alignSelf: 'center',
                }}
              >
                Bancos:
              </span>
              {BANCOS.map((b) => (
                <button
                  key={b}
                  onClick={() =>
                    setBancosFiltro((p) =>
                      p.includes(b) ? p.filter((x) => x !== b) : [...p, b]
                    )
                  }
                  style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    border: 'none',
                    background: bancosFiltro.includes(b) ? C.laranja : C.borda,
                    color: bancosFiltro.includes(b)
                      ? '#fff'
                      : C.textoSecundario,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr style={{ background: C.fundo }}>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        color: C.textoSecundario,
                        fontSize: 12,
                      }}
                    >
                      Banco
                    </th>
                    {PRAZOS.map((p) => (
                      <th
                        key={p}
                        style={{
                          textAlign: 'center',
                          padding: '10px 14px',
                          color: C.textoSecundario,
                          fontSize: 12,
                        }}
                      >
                        {p}x
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bancosFiltro.map((banco) => (
                    <tr
                      key={banco}
                      style={{ borderBottom: `1px solid ${C.borda}` }}
                    >
                      <td
                        style={{
                          padding: '12px 14px',
                          fontWeight: 700,
                          color: C.laranja,
                        }}
                      >
                        {banco}
                      </td>
                      {PRAZOS.map((prazo) => {
                        const r = simulacao.resultados.find(
                          (x) => x.banco === banco && x.prazo === prazo
                        );
                        const val = r?.valor ?? 0;
                        const maiores = bancosFiltro.map(
                          (b2) =>
                            simulacao.resultados.find(
                              (x) => x.banco === b2 && x.prazo === prazo
                            )?.valor ?? 0
                        );
                        const melhor = val > 0 && val === Math.max(...maiores);
                        return (
                          <td
                            key={prazo}
                            style={{ padding: '8px 8px', textAlign: 'center' }}
                          >
                            <div
                              onClick={() =>
                                val > 0 &&
                                digitarProposta(
                                  simulacao.cliente,
                                  banco,
                                  prazo,
                                  val
                                )
                              }
                              style={{
                                cursor: val > 0 ? 'pointer' : 'default',
                                borderRadius: 8,
                                padding: '8px 4px',
                                background: melhor
                                  ? `${C.verde}15`
                                  : 'transparent',
                                border: melhor
                                  ? `1px solid ${C.verde}40`
                                  : '1px solid transparent',
                              }}
                              onMouseEnter={(e) =>
                                val > 0 &&
                                (e.currentTarget.style.background = `${C.laranja}22`)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = melhor
                                  ? `${C.verde}15`
                                  : 'transparent')
                              }
                            >
                              <div
                                style={{
                                  color: C.verde,
                                  fontWeight: 700,
                                  fontSize: 13,
                                }}
                              >
                                {val > 0 ? fmt(val) : '—'}
                              </div>
                              {melhor && (
                                <div style={{ fontSize: 9, color: C.verde }}>
                                  ★ maior
                                </div>
                              )}
                              {val > 0 && (
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: C.textoSecundario,
                                  }}
                                >
                                  digitar
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                marginTop: 14,
                fontSize: 11,
                color: C.textoSecundario,
                textAlign: 'center',
              }}
            >
              Clique em qualquer valor para digitar a proposta · Coeficientes
              editáveis em ⚙️ Coeficientes
            </div>
          </div>
        </div>
      )}

      <style>{`input::placeholder{color:#475569;} *{box-sizing:border-box;} ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px;}`}</style>
    </div>
  );
}
