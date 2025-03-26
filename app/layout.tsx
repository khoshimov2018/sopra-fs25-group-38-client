import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ConfigProvider, App, theme } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "@/styles/globals.css";
import "@/styles/theme/index.module.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudyBuddy",
  description: "sopra-fs25-template-client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              // general theme options are set in token using our theme variables
              colorPrimary: "#2C2C2C", // matching --primary from our theme
              borderRadius: 8,
              colorText: "#1E1E1E", // matching --text-dark from our theme
              fontSize: 16,

              // Alias Token
              colorBgContainer: "#FFFFFF", // matching --bg-card from our theme
            },
            // if a component type needs special styling, setting here will override default options set in token
            components: {
              Button: {
                colorPrimary: "#2C2C2C", // matching --primary from our theme
                algorithm: true,
                controlHeight: 40, // matching our theme button height
                colorText: "#1E1E1E", // Set default button text color to black
                colorBorder: "#2C2C2C", // Default border color
                defaultColor: "#1E1E1E", // Default button color
                defaultBg: "#FFFFFF", // Default button background
              },
              Input: {
                colorBorder: "#D9D9D9", // matching --border-color from our theme
                colorTextPlaceholder: "#B3B3B3", // matching --text-placeholder from our theme
                colorText: "#1E1E1E", // Ensure input text is black
                colorTextBase: "#1E1E1E", // Base text color for inputs
                algorithm: true,
              },
              Form: {
                labelColor: "#1E1E1E", // matching --text-dark from our theme
                colorTextLabel: "#1E1E1E", // Ensure form labels are visible
                algorithm: theme.defaultAlgorithm,
              },
              Card: {
                colorBgContainer: "#FFFFFF", // matching --bg-card from our theme
                colorBorderSecondary: "#D9D9D9", // matching --border-color from our theme
              },
            },
          }}
        >
          <AntdRegistry>
            <App>
              {children}
            </App>
          </AntdRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
