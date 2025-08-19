import axios from 'axios';
import { BaseResponseType, MoodType, SentimentResult } from '@/type';
import { GEMINI_API_URL, moodList } from '@/utils/AppConstants';
import { GEMINI_API_KEY } from '@env';

/**
 *
 * @param journalEntry
 * @returns
 */
export async function analyzeSentiment(
  journalEntry: string,
): Promise<BaseResponseType<SentimentResult>> {
  const prompt = `Analyze the following journal entry and classify the mood as one of: very happy, happy, neutral, sad, angry. Also, provide a short tip for the user to improve their mood. Respond in JSON format as { mood: <mood>, tip: <tip>, moodLevel: <moodLevel> } only, where moodLevel is a number: very happy=1, happy=2, neutral=3, sad=4, angry=5.\n\nJournal Entry: "${journalEntry}"`;

  // Gemini API integration
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      msg: 'Gemini API key not set',
    };
  }

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    try {
      // Gemini returns candidates[0].content.parts[0].text
      console.log('response from gemini', JSON.stringify(response.data));
      const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

      // Remove markdown code block if present
      const cleanJson = content
        .replace(/```json[\r\n]?/g, '')
        .replace(/```[\r\n]?/g, '')
        .trim();

      const result = JSON.parse(cleanJson);

      var mood: MoodType = {
        moodLabel: result.mood,
        moodIcon:
          moodList[result.moodLevel - 1].moodIcon || moodList[2].moodIcon,
        moodLevel: result.moodLevel || 3,
      };
      return {
        success: true,
        data: {
          mood,
          tip: result.tip,
        },
        msg: 'Sentiment analyzed successfully (Gemini)',
      };
    } catch (e) {
      return {
        success: false,
        msg: 'Failed to parse Gemini response',
      };
    }
  } catch (e: any) {
    return {
      success: false,
      msg: `Failed to analyze sentiment: ${e.message} `,
    };
  }
}

export async function getMotivationSuggestion(): Promise<string> {
  const prompt = `Give me a short, positive, and actionable motivational message to help someone complete all their daily habits.`;

  // TODO: just put ! on GEMINI_API_KEY
  if (GEMINI_API_KEY) {
    return 'Stay positive and keep going!';
  }
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 60,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return (
      content?.replace(/```/g, '').trim() || 'Stay positive and keep going!'
    );
  } catch (e) {
    console.log('error from gemini', e);
    return 'Stay positive and keep going!';
  }
}

/**
 * Get personalized habit suggestions from AI based on mood + journal entry.
 */
export async function suggestHabitsFromAI(
  moodLabel: string,
  journalEntry: string,
): Promise<BaseResponseType<string[]>> {
  if (!GEMINI_API_KEY) {
    return { success: false, msg: 'Gemini API key not set' };
  }

  const prompt = `You are a helpful habit coach. Based on the user's mood and short journal entry, suggest 5 simple, actionable, and realistic habits they can attempt TODAY. Keep each habit shorter than 7 words. No explanations.

Return ONLY valid JSON in one of the two forms (prefer the first):
{ "habits": ["short habit 1", "short habit 2", ...] }
or
["short habit 1", "short habit 2", ...]

Mood: ${moodLabel}
Journal: "${journalEntry}"`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 200,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return { success: false, msg: 'Empty response from AI' };
    }

    const clean = content
      .replace(/```json[\r\n]?/g, '')
      .replace(/```[\r\n]?/g, '')
      .trim();

    try {
      const parsed = JSON.parse(clean);
      let habits: string[] | undefined;

      if (Array.isArray(parsed)) {
        habits = parsed;
      } else if (parsed && Array.isArray(parsed.habits)) {
        habits = parsed.habits;
      }

      if (habits && habits.length > 0) {
        const unique = Array.from(
          new Set(habits.map(h => `${h}`.trim())),
        ).filter(h => h.length > 0);
        return { success: true, data: unique.slice(0, 7) };
      }
    } catch (e) {
      // fallthrough to heuristic parsing
    }

    // Heuristic fallback: split by newlines / bullets
    const lines: string[] = clean
      .split(/\r?\n/)
      .map((l: string) => l.replace(/^[-*•\d.\s]+/, '').trim())
      .filter((line: string) => Boolean(line));
    if (lines.length > 0) {
      const unique = Array.from(new Set<string>(lines));
      return { success: true, data: unique.slice(0, 7) };
    }

    return { success: false, msg: 'Unable to parse AI suggestions' };
  } catch (e: any) {
    return {
      success: false,
      msg: `Failed to get AI suggestions: ${e.message}`,
    };
  }
}
