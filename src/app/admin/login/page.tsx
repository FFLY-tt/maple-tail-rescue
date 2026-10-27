import { LoginForm } from "@/components/admin/LoginForm";
import { Container } from "@/components/ui/Container";

export default function AdminLoginPage() {
  return (
    <Container narrow className="pt-10 pb-16">
      <h1 className="font-display text-4xl font-bold">Staff sign in</h1>
      <p className="mt-2 mb-8 text-lg text-muted">For Maple Tail Rescue staff and volunteers only.</p>
      <LoginForm />
    </Container>
  );
}
