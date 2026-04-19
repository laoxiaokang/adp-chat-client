export interface AgentCardDefinition {
  id: string
  agentType: string
  title: string
  desc: string
}

export const agentCardDefinitions: AgentCardDefinition[] = [
  {
    id: '1',
    agentType: '1',
    title: '健康咨询',
    desc: '日常健康问题，随时在线答疑',
  },
  {
    id: '2',
    agentType: '3',
    title: '用药助手',
    desc: '药物作用与服用方式快速查询',
  },
  {
    id: '3',
    agentType: '2',
    title: '智能问病',
    desc: '根据症状给出初步分析建议',
  },
  {
    id: '4',
    agentType: '4',
    title: '报告解读',
    desc: '体检检查结果一眼看懂重点',
  },
  {
    id: '5',
    agentType: '5',
    title: '健康管理',
    desc: 'mock 服务位，后续可接第五种问答场景',
  },
]

export const getAgentCardById = (id: string) => {
  return agentCardDefinitions.find((card) => card.id === id)
}

export const getAgentCardByAgentType = (agentType: string) => {
  return agentCardDefinitions.find((card) => card.agentType === agentType)
}

export const getAgentCardByTitle = (title: string) => {
  return agentCardDefinitions.find((card) => card.title === title)
}
