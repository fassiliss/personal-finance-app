import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: "9e0142001@smtp-brevo.com",
        pass: process.env.BREVO_SMTP_KEY,
    },
});

export async function POST(request: Request) {
    try {
        const { email, name } = await request.json();

        await transporter.sendMail({
            from: '"Personal Finance App" <fassil661@gmail.com>',
            to: "fassiliss@gmail.com",
            subject: "New User Signup - Approval Needed",
            html: `
                <h2>New User Registration</h2>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Name:</strong> ${name || "Not provided"}</p>
                <p>Please go to the admin dashboard to approve this user:</p>
                <a href="https://personal-finance-app-q6vw.vercel.app/admin">Open Admin Dashboard</a>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Email error:", error);
        return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
    }
}