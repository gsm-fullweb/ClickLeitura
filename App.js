import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { View, Text, Platform, TouchableOpacity } from "react-native";
import { AppProvider } from "./src/context/AppContext";
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";
import { supabase } from "./src/services/supabase"; // Importar o cliente Supabase

// Importação de telas
import HomeScreen from "./src/screens/HomeScreen";
import ReadingScreen from "./src/screens/ReadingScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import FacadeScreen from "./src/screens/FacadeScreen";
import RoteiroScreen from "./src/screens/RoteiroScreen";
import LeituraRoteiroScreen from "./src/screens/LeituraRoteiroScreen";
import ReadingDetailsScreen from "./src/screens/ReadingDetailsScreen";
import SQLiteTestScreen from "./src/screens/SQLiteTestScreen";
import LoginScreen from "./src/screens/LoginScreen";
import WebhookResponseScreen from "./src/screens/WebhookResponseScreen"; // Importar a nova tela

// Criação dos navegadores
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Componente de mensagem de ambiente web
const WebNotice = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#4299e1",
        padding: 10,
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <Text style={{ color: "white", fontWeight: "bold" }}>
        Versão Web - Algumas funcionalidades nativas estão simuladas
      </Text>
      <Text
        style={{
          color: "white",
          marginTop: 5,
          textDecorationLine: "underline",
        }}
        onPress={() => setDismissed(true)}
      >
        Fechar
      </Text>
    </View>
  );
};

// Roteamento principal com abas de navegação
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          // Definir ícones para cada rota
          if (route.name === "Início") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Nova Leitura") {
            iconName = focused ? "add-circle" : "add-circle-outline";
          } else if (route.name === "Roteiro") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "Fachada") {
            iconName = focused ? "business" : "business-outline";
          } else if (route.name === "Histórico") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Configurações") {
            iconName = focused ? "settings" : "settings-outline";
          } else if (route.name === "Teste SQLite") {
            iconName = focused ? "code" : "code-outline";
          }

          // Retornar o ícone
          return (
            <Ionicons
              testID="tab-icon"
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: "#4299e1",
        tabBarInactiveTintColor: "gray",
        headerShown: true,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      })}
    >
      <Tab.Screen
        name="Início"
        component={HomeScreen}
        options={{
          title: "AppLeiturista",
        }}
      />
      <Tab.Screen
        name="Roteiro"
        component={RoteiroScreen}
        options={{
          title: "Roteiro do Dia",
        }}
      />
      <Tab.Screen
        name="Fachada"
        component={FacadeScreen}
        options={{
          title: "Foto da Fachada",
        }}
      />
      <Tab.Screen
        name="Configurações"
        component={SettingsScreen}
        options={{
          title: "Configurações",
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Aplicativo principal - AppLeiturista
 * Um aplicativo para leituristas de água com funcionalidade offline,
 * OCR para leitura automática de medidores e sincronização com Supabase.
 */
// Componente para exibir erros de forma amigável
const ErrorFallback = ({ error }) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 10,
          color: "red",
        }}
      >
        Ocorreu um erro
      </Text>
      <Text style={{ marginBottom: 20, textAlign: "center" }}>
        {error?.message || "Erro desconhecido na aplicação"}
      </Text>
      <Text
        style={{ color: "#4299e1", textDecorationLine: "underline" }}
        onPress={() => {
          // Tentar reiniciar a aplicação
          if (Platform.OS === "web") {
            window.location.reload();
          }
        }}
      >
        Tentar novamente
      </Text>
    </View>
  );
};

export default function App() {
  const isWeb = Platform.OS === "web";
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Começa como true para carregar a sessão
  const [initialRoute, setInitialRoute] = useState("Login"); // Rota inicial padrão é Login

  // Initialize Tempo Devtools
  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      try {
        const { TempoDevtools } = require("tempo-devtools");
        TempoDevtools.init();
      } catch (err) {
        console.error("Erro ao inicializar Tempo Devtools:", err);
      }
    }
  }, []);

  // Verifica a sessão do Supabase ao iniciar o aplicativo
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setInitialRoute("Main"); // Se houver sessão, vai para a tela principal
      } else {
        setInitialRoute("Login"); // Se não houver sessão, vai para a tela de login
      }
      setIsLoading(false); // Termina o carregamento da sessão
    };

    checkSession();

    // Opcional: Adicionar listener para mudanças de estado de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setInitialRoute("Main");
      } else {
        setInitialRoute("Login");
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);


  // Manipulador global de erros não capturados
  useEffect(() => {
    const handleError = (error) => {
      console.error("Erro não capturado:", error);
      setError(error);
    };

    // Adicionar listener para erros não capturados
    if (Platform.OS === "web") {
      window.addEventListener("error", (event) => {
        event.preventDefault();
        handleError(event.error);
      });

      window.addEventListener("unhandledrejection", (event) => {
        event.preventDefault();
        handleError(new Error(event.reason || "Promise rejected"));
      });
    }

    return () => {
      // Remover listeners ao desmontar
      if (Platform.OS === "web") {
        window.removeEventListener("error", handleError);
        window.removeEventListener("unhandledrejection", handleError);
      }
    };
  }, []);

  // Se estiver carregando a sessão, mostrar indicador de carregamento
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Verificando sessão...</Text>
      </View>
    );
  }

  // Se houver um erro, mostrar o componente de fallback
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Renderizar a aplicação dentro de um try-catch
  try {
    return (
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          {isWeb && <WebNotice />}

          <Stack.Navigator
            initialRouteName={initialRoute} // Define a rota inicial dinamicamente
            screenOptions={{
              headerTitleStyle: {
                fontWeight: "bold",
              },
            }}
          >
            {/* Tela de Login */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }} // Oculta o cabeçalho na tela de login
            />

            {/* Tela principal com abas de navegação */}
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />

            {/* Telas sem abas (fluxo de navegação) */}
            <Stack.Screen
              name="LeituraRoteiro"
              component={LeituraRoteiroScreen}
              options={{
                title: "Registrar Leitura",
                presentation: "card",
              }}
            />

            <Stack.Screen
              name="ReadingDetails"
              component={ReadingDetailsScreen}
              options={{
                title: "Detalhes da Leitura",
                presentation: "card",
              }}
            />

            {/* Tela para exibir a resposta do webhook */}
            <Stack.Screen
              name="WebhookResponseScreen"
              component={WebhookResponseScreen}
              options={{
                title: "Resposta do Webhook",
                presentation: "card",
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    );
  } catch (err) {
    console.error("Erro ao renderizar App:", err);
    setError(err);
    return <ErrorFallback error={err} />;
  }
}
