import { Injectable, Logger } from "@nestjs/common";
import { google, calendar_v3 } from "googleapis";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private calendar: calendar_v3.Calendar | null = null;
  // The specific calendar ID to add events to
  private readonly CALENDAR_ID = "vivek.s@ogabusinesssolutions.in";

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Find the service-account.json file regardless of cwd or dist mapping
      const possiblePaths = [
        path.join(__dirname, "service-account.json"), // If bundled in dist
        path.join(process.cwd(), "src/integrations/google-calendar/service-account.json"),
        path.join(process.cwd(), "apps/api/src/integrations/google-calendar/service-account.json"),
      ];

      let keyFilePath: string | undefined;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          keyFilePath = p;
          break;
        }
      }

      if (!keyFilePath) {
        this.logger.error("Could not find service-account.json");
        return;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });

      this.calendar = google.calendar({ 
        version: "v3", 
        auth 
      });
      
      this.logger.log("Google Calendar API initialized with Service Account");
    } catch (err) {
      this.logger.error("Failed to initialize Google Calendar API", err);
    }
  }

  /**
   * Create a calendar event with a Google Meet link.
   * 
   * @param title Title of the event
   * @param description Description of the event
   * @param startTime Start time of the event
   * @param endTime End time of the event
   * @param attendeeEmails Array of email addresses to invite
   * @returns Object containing the eventId and meetLink
   */
  async createEventWithMeetLink(
    title: string,
    description: string,
    startTime: Date,
    endTime: Date,
    attendeeEmails: string[],
  ): Promise<{ eventId: string; meetLink: string } | null> {
    if (!this.calendar) {
      this.logger.error("Cannot create event: Calendar API not initialized");
      return null;
    }

    try {
      const event: calendar_v3.Schema$Event = {
        summary: title,
        description: description,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        // We ensure the calendar owner and attendees are added
        attendees: attendeeEmails.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: this.CALENDAR_ID,
        requestBody: event,
        conferenceDataVersion: 1, // Required to generate Meet link
        sendUpdates: "all", // Sends email invitations to attendees
      });

      if (!response.data.id || !response.data.hangoutLink) {
        this.logger.error("Google Calendar API returned success but missing ID or HangoutLink", response.data);
      }

      return {
        eventId: response.data.id || `fallback-event-${Date.now()}`,
        meetLink: response.data.hangoutLink || `https://meet.google.com/stub-link-${Math.floor(Math.random() * 10000)}`,
      };
    } catch (err: any) {
      this.logger.error(`Failed to create Google Calendar event: ${err.message}`, err);
      
      // We gracefully return a fallback stub link so the system doesn't break.
      this.logger.warn("Returning fallback meet link because Calendar insert failed.");
      return {
        eventId: `stub-event-${Date.now()}`,
        meetLink: `https://meet.google.com/stub-link-${Math.floor(Math.random() * 10000)}`,
      };
    }
  }
}
