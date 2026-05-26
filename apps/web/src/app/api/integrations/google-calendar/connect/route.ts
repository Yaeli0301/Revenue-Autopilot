import { NextResponse } from "next/server";

import { getCurrentOrg } from "@/lib/auth";

import { getAuthContext } from "@/lib/app-auth";

import { requireDbUser } from "@/lib/api-guards";

import {

  getGoogleAuthUrl,

  getGoogleCalendarStatus,

  isGoogleOAuthConfigured,

} from "@/lib/google-calendar";

import { createOAuthState } from "@revenue-autopilot/lib";



export async function GET() {

  try {

    const ctx = await getAuthContext();

    const authError = requireDbUser(ctx);

    if (authError) return authError;



    const org = await getCurrentOrg(ctx!.dbUser!.id);

    if (!org) {

      return NextResponse.json({ ok: false, error: "No organization" }, { status: 404 });

    }



    const status = await getGoogleCalendarStatus(org.id);



    return NextResponse.json({

      ok: true,

      ...status,

      oauthConfigured: isGoogleOAuthConfigured(),

    });

  } catch (error) {

    console.error("Calendar status error:", error);

    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });

  }

}



export async function POST() {

  try {

    const ctx = await getAuthContext();

    const authError = requireDbUser(ctx);

    if (authError) return authError;



    const org = await getCurrentOrg(ctx!.dbUser!.id);

    if (!org) {

      return NextResponse.json({ ok: false, error: "No organization" }, { status: 404 });

    }



    if (!isGoogleOAuthConfigured()) {

      return NextResponse.json({

        ok: true,

        url: null,

        message: "Google OAuth not configured — skipped in dev",

      });

    }



    const state = await createOAuthState(org.id, ctx!.dbUser!.id);

    const url = getGoogleAuthUrl(state);

    return NextResponse.json({ ok: true, url });

  } catch (error) {

    console.error("Calendar connect error:", error);

    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });

  }

}

