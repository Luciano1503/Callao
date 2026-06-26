import java.sql.*;

public class GetConstraint {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/CALLAO?currentSchema=callao";
        String user = "postgres";
        String pass = "Romel2004";
        try (Connection conn = DriverManager.getConnection(url, user, pass);
             PreparedStatement stmt = conn.prepareStatement(
                 "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'chk_ficha_veedor_estado'"
             );
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                System.out.println("Constraint definition: " + rs.getString(1));
            } else {
                System.out.println("Constraint not found.");
            }
        }
    }
}
