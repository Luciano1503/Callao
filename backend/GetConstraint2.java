import java.sql.*;

public class GetConstraint2 {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/CALLAO?currentSchema=callao";
        String user = "postgres";
        String pass = "Romel2004";
        try (Connection conn = DriverManager.getConnection(url, user, pass);
             PreparedStatement stmt = conn.prepareStatement(
                 "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname LIKE '%estado%'"
             );
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                System.out.println(rs.getString(1) + ": " + rs.getString(2));
            }
        }
    }
}
