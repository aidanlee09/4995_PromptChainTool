import { Metadata } from "next";
import { LoginFormWithSuspense } from "./LoginForm";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "Prompt Chain Tool",
};

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <LoginFormWithSuspense />
    </div>
  );
}
