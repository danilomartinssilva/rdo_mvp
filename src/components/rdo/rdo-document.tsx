import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, color: "#1c1917" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1, borderBottomColor: "#d6d3d1", paddingBottom: 14 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 6 },
  muted: { color: "#57534e", lineHeight: 1.5 },
  logo: { width: 76, height: 44, borderRadius: 6, backgroundColor: "#1c1917", padding: 7, alignItems: "center", justifyContent: "center" },
  logoMark: { color: "#f59e0b", fontSize: 16, fontWeight: 700, lineHeight: 1 },
  logoName: { color: "#ffffff", fontSize: 7, letterSpacing: 1.3, marginTop: 4 },
  section: { marginTop: 16 },
  heading: { fontSize: 12, fontWeight: 700, borderBottomWidth: 1, borderBottomColor: "#d6d3d1", paddingBottom: 4, marginBottom: 6 },
  row: { marginBottom: 4 },
  signatures: { marginTop: 28, flexDirection: "row", gap: 28 },
  signature: { flex: 1, paddingTop: 32, borderTopWidth: 1, borderTopColor: "#78716c" },
  signatureTitle: { fontSize: 10, fontWeight: 700, marginBottom: 4 },
  signatureDetail: { fontSize: 8, color: "#57534e", lineHeight: 1.5 },
});

type Item = Record<string, unknown>;
type RdoPdf = { date: string; status: string; weather_morning: string; weather_afternoon: string; notes: string | null; projects: { name: string; address: string }; rdo_labor: Item[]; rdo_equipment: Item[]; rdo_activities: Item[]; rdo_occurrences: Item[] };

function List({ items, children }: { items: Item[]; children: (item: Item) => string }) {
  return <>{items.length ? items.map((item, index) => <Text key={index} style={styles.row}>• {children(item)}</Text>) : <Text style={styles.muted}>Não informado.</Text>}</>;
}

function Signature({ title }: { title: string }) {
  return <View style={styles.signature}><Text style={styles.signatureTitle}>{title}</Text><Text style={styles.signatureDetail}>Assinatura</Text><Text style={styles.signatureDetail}>Nome: __________________________________</Text><Text style={styles.signatureDetail}>Data: ____ / ____ / ______</Text></View>;
}

export function RdoDocument({ rdo }: { rdo: RdoPdf }) {
  return <Document title={`RDO ${rdo.date}`}><Page size="A4" style={styles.page}><View style={styles.header}><View><Text style={styles.title}>Relatório Diário de Obra</Text><Text style={styles.muted}>{rdo.projects.name}{"\n"}{rdo.projects.address}{"\n"}Data: {rdo.date} | Status: {rdo.status}</Text></View><View style={styles.logo}><Text style={styles.logoMark}>C</Text><Text style={styles.logoName}>CANTEIRO</Text></View></View><View style={styles.section}><Text style={styles.heading}>Condições climáticas</Text><Text>Manhã: {rdo.weather_morning} | Tarde: {rdo.weather_afternoon}</Text></View><View style={styles.section}><Text style={styles.heading}>Mão de obra</Text><List items={rdo.rdo_labor}>{(item) => `${item.quantity} ${item.role_name}${item.is_outsourced ? " (terceirizada)" : ""}`}</List></View><View style={styles.section}><Text style={styles.heading}>Equipamentos</Text><List items={rdo.rdo_equipment}>{(item) => `${item.quantity} ${item.type_name}`}</List></View><View style={styles.section}><Text style={styles.heading}>Atividades realizadas</Text><List items={rdo.rdo_activities}>{(item) => `${item.description} (${item.status})`}</List></View><View style={styles.section}><Text style={styles.heading}>Ocorrências</Text><List items={rdo.rdo_occurrences}>{(item) => String(item.description)}</List></View><View style={styles.section}><Text style={styles.heading}>Observações</Text><Text>{rdo.notes || "Não informado."}</Text></View><View style={styles.signatures} wrap={false}><Signature title="Empresa contratada" /><Signature title="Contratante" /></View></Page></Document>;
}
