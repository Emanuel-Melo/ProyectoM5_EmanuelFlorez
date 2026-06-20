import { useAuth } from "../../auth/hooks/useAuth";

function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div>
      <h1>Home</h1>

      <p>Loading: {String(loading)}</p>

      <p>User: {user?.email ?? "null"}</p>
    </div>
  );
}

export default HomePage;
