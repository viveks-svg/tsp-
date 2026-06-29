import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';


export interface GeocodeResult {
  lat: number;
  lng: number;
  timezone: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) { }

  async getCoordinates(place: string): Promise<GeocodeResult> {
    const normalizedPlace = place.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(normalizedPlace).digest('hex');
    const cacheKey = `geocode:${hash}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as GeocodeResult;
    }

    const apiKey = this.configService.get<string>('OPENCAGE_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENCAGE_API_KEY is not set, falling back to default coordinates (Delhi)');
      return { lat: 28.6139, lng: 77.2090, timezone: 'Asia/Kolkata' };
    }

    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(place)}&key=${apiKey}`;
      const response: any = await lastValueFrom(this.httpService.get(url));

      const results = response.data?.results;
      if (results && results.length > 0) {
        const bestMatch = results[0];
        const result: GeocodeResult = {
          lat: bestMatch.geometry.lat,
          lng: bestMatch.geometry.lng,
          timezone: bestMatch.annotations?.timezone?.name || 'Asia/Kolkata',
        };

        // TTL 7 days = 604800 seconds
        await this.redisService.set(cacheKey, JSON.stringify(result), 604800);
        return result;
      }

      throw new Error('Location not found');
    } catch (error: any) {
      this.logger.error(`Geocoding failed for ${place}: ${error.message}`);
      // Fallback to Delhi if error
      return { lat: 28.6139, lng: 77.2090, timezone: 'Asia/Kolkata' };
    }
  }

  async searchPlaces(query: string): Promise<{ name: string }[]> {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(normalizedQuery).digest('hex');
    const cacheKey = `placesearch:${hash}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const apiKey = this.configService.get<string>('OPENCAGE_API_KEY');
    if (!apiKey) {
      // Mock data for development when API key is missing
      return [
        { name: `${query}, Delhi, India` },
        { name: `${query}, Mumbai, India` },
        { name: `${query}, Uttar Pradesh, India` },
      ];
    }

    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=5`;
      const response: any = await lastValueFrom(this.httpService.get(url));

      const results = response.data?.results || [];
      const mappedResults = results.map((r: any) => ({
        name: r.formatted,
      }));

      // Cache for 7 days
      if (mappedResults.length > 0) {
        await this.redisService.set(cacheKey, JSON.stringify(mappedResults), 604800);
      }
      return mappedResults;
    } catch (error: any) {
      this.logger.error(`Place search failed for ${query}: ${error.message}`);
      return [];
    }
  }
}
