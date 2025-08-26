import axios from 'axios';

// Local imports
import { BaseResponseType, MoodType, SentimentResult } from '@/type';
import { GEMINI_API_URL, moodList } from '@/utils/AppConstants';
import { GEMINI_API_KEY } from '@env';

// ========================================================================
// SENTIMENT ANALYSIS SERVICES
// ========================================================================

/**
 * Analyzes the sentiment of a journal entry using Gemini AI
 *
 * Analyzes the emotional content of the provided text and classifies it into
 * one of five mood categories, providing a personalized tip for mood improvement.
 *
 * @param journalEntry - The journal text to analyze for sentiment
 * @returns Promise with success status and sentiment analysis results or error message
 */
export async function analyzeSentiment(
  journalEntry: string,
): Promise<BaseResponseType<SentimentResult>> {
  const prompt = `Analyze the following journal entry and classify the mood as one of: very happy, happy, neutral, sad, angry. Also, provide a short tip for the user to improve their mood. Respond in JSON format as { mood: <mood>, tip: <tip>, moodLevel: <moodLevel> } only, where moodLevel is a number: very happy=1, happy=2, neutral=3, sad=4, angry=5.\n\nJournal Entry: "${journalEntry}"`;

  // Validate API key availability
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
        timeout: 30000, // 30 second timeout
      },
    );

    try {
      // Extract response content from Gemini API
      const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        return {
          success: false,
          msg: 'Empty response from Gemini API',
        };
      }

      // Clean JSON response by removing markdown formatting
      const cleanJson = content
        .replace(/```json[\r\n]?/g, '')
        .replace(/```[\r\n]?/g, '')
        .trim();

      const result = JSON.parse(cleanJson);

      // Map mood level to mood object with icon
      const mood: MoodType = {
        moodLabel: result.mood,
        moodIcon:
          moodList[result.moodLevel - 1]?.moodIcon || moodList[2].moodIcon,
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
    } catch (parseError) {
      return {
        success: false,
        msg: 'Failed to parse Gemini response',
      };
    }
  } catch (apiError: any) {
    // Handle different types of errors
    let errorMessage = 'Failed to analyze sentiment';

    if (
      apiError.code === 'ECONNABORTED' ||
      apiError.message?.includes('timeout')
    ) {
      errorMessage =
        'Request timed out. Please check your internet connection and try again.';
    } else if (
      apiError.code === 'ERR_NETWORK' ||
      apiError.message?.includes('Network Error')
    ) {
      errorMessage =
        'Network connection issue. Please check your internet and try again.';
    } else if (apiError.response?.status === 429) {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (apiError.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (apiError.response?.status >= 400) {
      errorMessage = 'Invalid request. Please check your input and try again.';
    }

    return {
      success: false,
      msg: errorMessage,
    };
  }
}

// ========================================================================
// MOTIVATION & HABIT SUGGESTION SERVICES
// ========================================================================

/**
 * Generates a motivational message to encourage habit completion
 *
 * Uses Gemini AI to create personalized, positive, and actionable motivational
 * messages that help users maintain momentum in completing their daily habits.
 *
 * @returns Promise with motivational message string or fallback message
 */
export async function getMotivationSuggestion(): Promise<string> {
  const prompt = `Give me a short, positive, and actionable motivational message to help someone complete all their daily habits.`;

  // Validate API key availability
  if (!GEMINI_API_KEY) {
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
        timeout: 15000, // 15 second timeout
      },
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return (
      content?.replace(/```/g, '').trim() || 'Stay positive and keep going!'
    );
  } catch (error: any) {
    // Return fallback message for any error
    return 'Stay positive and keep going!';
  }
}

/**
 * Generates personalized habit suggestions based on user's mood and journal entry
 *
 * Analyzes the user's current emotional state and journal content to suggest
 * relevant, achievable habits that align with their current situation and mood.
 *
 * @param moodLabel - The user's current mood classification
 * @param journalEntry - The user's journal text for context
 * @returns Promise with success status and array of habit suggestions or error message
 */
export async function suggestHabitsFromAI(
  moodLabel: string,
  journalEntry: string,
): Promise<BaseResponseType<string[]>> {
  // Validate API key availability
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
        timeout: 30000, // 30 second timeout
      },
    );

    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return { success: false, msg: 'Empty response from AI' };
    }

    // Clean response content
    const clean = content
      .replace(/```json[\r\n]?/g, '')
      .replace(/```[\r\n]?/g, '')
      .trim();

    try {
      // Attempt to parse JSON response
      const parsed = JSON.parse(clean);
      let habits: string[] | undefined;

      // Handle different response formats
      if (Array.isArray(parsed)) {
        habits = parsed;
      } else if (parsed && Array.isArray(parsed.habits)) {
        habits = parsed.habits;
      }

      if (habits && habits.length > 0) {
        // Clean and deduplicate habits
        const unique = Array.from(
          new Set(habits.map(h => `${h}`.trim())),
        ).filter(h => h.length > 0);
        return { success: true, data: unique.slice(0, 7) };
      }
    } catch (parseError) {
      // Fall through to heuristic parsing if JSON parsing fails
    }

    // Heuristic fallback: parse by newlines and bullet points
    const lines: string[] = clean
      .split(/\r?\n/)
      .map((l: string) => l.replace(/^[-*•\d.\s]+/, '').trim())
      .filter((line: string) => Boolean(line));

    if (lines.length > 0) {
      const unique = Array.from(new Set<string>(lines));
      return { success: true, data: unique.slice(0, 7) };
    }

    return { success: false, msg: 'Unable to parse AI suggestions' };
  } catch (error: any) {
    // Handle different types of errors
    let errorMessage = 'Failed to get AI suggestions';

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage =
        'Request timed out. Please check your internet connection and try again.';
    } else if (
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error')
    ) {
      errorMessage =
        'Network connection issue. Please check your internet and try again.';
    } else if (error.response?.status === 429) {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.response?.status >= 400) {
      errorMessage = 'Invalid request. Please check your input and try again.';
    }

    return {
      success: false,
      msg: errorMessage,
    };
  }
}
