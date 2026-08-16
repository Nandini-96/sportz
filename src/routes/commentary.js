import  {Router} from "express";
import {createCommentarySchema, listCommentaryQuerySchema} from "../validation/commentary.js";
import {matchIdParamSchema} from "../validation/matches.js";
import {db} from "../db/db.js";
import {commentary} from "../db/schema.js";
import {desc, eq} from "drizzle-orm";

const MAX_LIMIT = 100;

export const commentaryRouter = Router({mergeParams: true});

commentaryRouter.get("/", async (req, res) => {
    const paramsResult = matchIdParamSchema.safeParse(req.params);

    if (!paramsResult.success) {
        return res.status(400).json({ error: 'Invalid match ID.', details: paramsResult.error.issues });
    }

    const queryResult = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
        return res.status(400).json({ error: 'Invalid query parameters.', details: queryResult.error.issues });
    }

    try {
        const { id: matchId } = paramsResult.data;
        const { limit = 10 } = queryResult.data;

        const safeLimit = Math.min(limit ?? MAX_LIMIT, MAX_LIMIT);

        // Fetch newest commentary first
        const results = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, matchId))
            .orderBy(desc(commentary.createdAt))
            .limit(safeLimit);

        return res.status(200).json(results);
    } catch (error) {
        console.error('Failed to fetch commentary:', error);
        res.status(500).json({ error: 'Failed to fetch commentary.' });
    }
});

commentaryRouter.post("/", async (req, res) => {
    // Validate matchId
    const paramsResult = matchIdParamSchema.parse(req.params);

    if(!paramsResult.success){
        return res.status(400).json({error:'Invalid match ID.',details:paramsResult.error.issues});
    }

    // Validate request body
    const bodyResult = createCommentarySchema.parse(req.body);

    if(!bodyResult.success){
        return res.status(400).json({error:'Invalid commentary payload',details:bodyResult.error.issues});
    }


    try {
        // Insert commentary
        const [result] = await db
            .insert(commentary)
            .values({
                matchId: paramsResult.data.id,
                minutes: bodyResult.minutes,
                sequence: bodyResult.sequence,
                period: bodyResult.period,
                eventType: bodyResult.eventType,
                actor: bodyResult.actor,
                team: bodyResult.team,
                message: bodyResult.message,
                metadata: bodyResult.metadata,
                tags: bodyResult.tags,
            })
            .returning();
        if(res.app.locals.broadcastCommentary){
            res.app.locals.broadcastCommentary(result.matchId,result);
        }
        return res.status(201).json(result);
    } catch (error) {
        console.error("Failed to create commentary:", error);

        res.status(500).json({
            error: 'Failed to create commentary'
        });
    }
});

