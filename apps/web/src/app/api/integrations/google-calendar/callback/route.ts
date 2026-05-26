import { NextResponse } from "next/server";

import { prisma } from "@revenue-autopilot/lib/db";

import { exchangeGoogleCode } from "@/lib/google-calendar";

import { enqueueCalendarSync } from "@/lib/jobs/enqueue";

import { verifyOAuthState } from "@revenue-autopilot/lib";

import { getAppUrl } from "@/lib/api-guards";



export async function GET(req: Request) {

  const appUrl = getAppUrl();

  const { searchParams } = new URL(req.url);

  const code = searchParams.get("code");

  const state = searchParams.get("state");

  const error = searchParams.get("error");



  if (error || !code || !state) {

    return NextResponse.redirect(`${appUrl}/onboarding?error=calendar`);

  }



  const verified = await verifyOAuthState(state);

  if (!verified) {

    return NextResponse.redirect(`${appUrl}/onboarding?error=calendar`);

  }



  const { organizationId, userId } = verified;



  try {

    const membership = await prisma.membership.findFirst({

      where: { organizationId, userId },

    });

    if (!membership) {

      return NextResponse.redirect(`${appUrl}/onboarding?error=calendar`);

    }



    const tokens = await exchangeGoogleCode(code);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);



    if (!tokens.refresh_token) {

      console.warn(

        "[google-calendar] No refresh_token returned — user may need to re-consent"

      );

    }



    const existing = await prisma.integration.findUnique({

      where: {

        organizationId_type: {

          organizationId,

          type: "GOOGLE_CALENDAR",

        },

      },

    });



    const existingMeta =

      existing?.metadata && typeof existing.metadata === "object"

        ? (existing.metadata as Record<string, unknown>)

        : {};



    await prisma.integration.upsert({

      where: {

        organizationId_type: {

          organizationId,

          type: "GOOGLE_CALENDAR",

        },

      },

      create: {

        organizationId,

        type: "GOOGLE_CALENDAR",

        accessToken: tokens.access_token,

        refreshToken: tokens.refresh_token,

        tokenExpiresAt: expiresAt,

        active: true,

        metadata: {

          connectedAt: new Date().toISOString(),

          lastRefreshedAt: new Date().toISOString(),

        },

      },

      update: {

        accessToken: tokens.access_token,

        refreshToken: tokens.refresh_token ?? undefined,

        tokenExpiresAt: expiresAt,

        active: true,

        metadata: {

          ...existingMeta,

          lastRefreshedAt: new Date().toISOString(),

          lastError: null,

        },

      },

    });



    await enqueueCalendarSync(organizationId);



    return NextResponse.redirect(`${appUrl}/onboarding?calendar=connected`);

  } catch (e) {

    console.error("Google callback error:", e);

    return NextResponse.redirect(`${appUrl}/onboarding?error=calendar`);

  }

}

