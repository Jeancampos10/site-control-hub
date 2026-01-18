import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the user's token to check permissions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !currentUser) {
      console.error("User not authenticated:", userError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Current user:", currentUser.id);

    // Check if the current user is an admin
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .single();

    if (roleError || !roleData) {
      console.error("Error fetching user role:", roleError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar permissões" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (roleData.role !== "admin_principal" && roleData.role !== "admin") {
      console.error("User is not admin:", roleData.role);
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem criar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User is admin, proceeding with user creation");

    // Parse the request body
    const body = await req.json();
    const { nome, sobrenome, email, password, whatsapp, tipoUsuario } = body;

    // Validate required fields
    if (!nome || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Nome, email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map tipoUsuario to role
    let role = "colaborador";
    if (tipoUsuario === "Sala Técnica") {
      role = "admin";
    } else if (tipoUsuario === "Administrador") {
      role = "admin";
    }

    console.log("Creating user with email:", email, "role:", role);

    // Create a Supabase client with service role to create the user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create the user using admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nome,
        sobrenome: sobrenome || "",
        whatsapp: whatsapp || null,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      
      // Check for specific error messages
      if (createError.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Este email já está cadastrado" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: createError.message || "Erro ao criar usuário" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created:", newUser.user?.id);

    // The trigger will create the profile and user_roles automatically
    // But we need to update the role to the correct one (since trigger defaults to colaborador)
    // Wait a moment for the trigger to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update the role if needed
    if (role !== "colaborador") {
      const { error: updateRoleError } = await adminClient
        .from("user_roles")
        .update({ role, approved: true })
        .eq("user_id", newUser.user!.id);

      if (updateRoleError) {
        console.error("Error updating role:", updateRoleError);
        // Don't fail the whole operation, just log the error
      } else {
        console.log("Role updated to:", role);
      }
    } else {
      // Just approve the user
      const { error: approveError } = await adminClient
        .from("user_roles")
        .update({ approved: true })
        .eq("user_id", newUser.user!.id);

      if (approveError) {
        console.error("Error approving user:", approveError);
      } else {
        console.log("User approved");
      }
    }

    console.log("User creation completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Apontador cadastrado com sucesso!",
        userId: newUser.user?.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
