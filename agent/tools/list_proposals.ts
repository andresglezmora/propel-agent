import { defineTool } from "eve/tools";
import { z } from "zod";
import { listRecentProposals, type Proposal } from "#lib/db";

export default defineTool({
  description: "Lista las propuestas más recientes (cualquier escuela), con su estado actual.",
  inputSchema: z.object({ limit: z.number().int().min(1).max(50).optional() }),
  label: { start: () => "Listar propuestas recientes" },
  async execute({ limit }) {
    const proposals = await listRecentProposals(limit ?? 10);
    return {
      proposals: proposals.map((p: Proposal) => ({
        proposalId: p.id,
        schoolName: p.school_name,
        campusMode: p.campus_mode,
        status: p.status,
        approvedVersion: p.approved_version,
      })),
    };
  },
});
