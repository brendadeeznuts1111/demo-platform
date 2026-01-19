#!/usr/bin/env bun

// Fetch API Example for @DEMO
// Following the exact pattern from Bun documentation
// https://bun.com/docs/runtime/http/server

async function testFetchAPI() {
  console.log("🚀 Testing Enhanced Fetch API with @DEMO Server");
  console.log("=" .repeat(60));
  
  try {
    // Example 1: Enhanced Status Check
    console.log("\n📈 Example 1: Enhanced Status Check");
    const statusResponse = await fetch("http://localhost:3000/api/status");
    console.log("Status Code:", statusResponse.status);
    
    const statusData = await statusResponse.json();
    console.log("Service:", statusData.service);
    console.log("Uptime:", Math.floor(statusData.uptime) + "s");
    console.log("Memory Usage:", statusData.performance.memory.used + "MB");
    console.log("Environment:", statusData.environment);
    
    // Example 2: Comprehensive Health Check
    console.log("\n❤️ Example 2: Comprehensive Health Check");
    const healthResponse = await fetch("http://localhost:3000/api/health");
    console.log("Health Status:", healthResponse.status);
    
    const healthData = await healthResponse.json();
    console.log("Package:", healthData.package);
    console.log("Services Running:", Object.keys(healthData.services).length);
    console.log("System Platform:", healthData.system.platform);
    console.log("All Checks:", Object.values(healthData.checks).join(", "));
    
    // Example 3: Detailed Metrics
    console.log("\n📊 Example 3: Detailed Performance Metrics");
    const metricsResponse = await fetch("http://localhost:3000/api/metrics");
    console.log("Metrics Status:", metricsResponse.status);
    
    const metricsData = await metricsResponse.json();
    console.log("Active Users:", metricsData.users.active);
    console.log("Total Requests:", metricsData.requests.total);
    console.log("Success Rate:", Math.round((metricsData.requests.successful / metricsData.requests.total) * 100) + "%");
    console.log("Events Processed:", metricsData.analytics.events_processed);
    console.log("Collaboration Docs:", metricsData.collaboration.documents);
    console.log("Security Sessions:", metricsData.security.active_sessions);
    
    // Example 4: POST request with JSON
    console.log("\n📤 Example 4: POST Analytics Data");
    const analyticsResponse = await fetch("http://localhost:3000/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "user_login",
        timestamp: new Date().toISOString(),
        data: { userId: "123", sessionId: "abc123" }
      })
    });
    
    console.log("POST Status:", analyticsResponse.status);
    const analyticsResult = await analyticsResponse.json();
    console.log("Analytics Result:", JSON.stringify(analyticsResult, null, 2));
    
    // Example 4: Dynamic user endpoint
    console.log("\n👤 Example 4: Dynamic User Route");
    const userResponse = await fetch("http://localhost:3000/api/users/john");
    console.log("User Status:", userResponse.status);
    
    const userData = await userResponse.json();
    console.log("User Data:", JSON.stringify(userData, null, 2));
    
    // Example 5: Error handling
    console.log("\n❌ Example 5: Error Handling");
    try {
      const errorResponse = await fetch("http://localhost:3000/api/nonexistent");
      console.log("Error Status:", errorResponse.status);
      
      if (errorResponse.status === 404) {
        const errorData = await errorResponse.json();
        console.log("Error Data:", JSON.stringify(errorData, null, 2));
      }
    } catch (error) {
      console.error("Fetch error:", error.message);
    }
    
    // Example 6: Headers inspection
    console.log("\n📋 Example 6: Response Headers");
    const docsResponse = await fetch("http://localhost:3000/docs");
    console.log("Docs Status:", docsResponse.status);
    console.log("Content-Type:", docsResponse.headers.get("content-type"));
    
    const docsData = await docsResponse.json();
    console.log("Available Endpoints:", docsData.endpoints.join(", "));
    
    console.log("\n✅ All fetch examples completed successfully!");
    
  } catch (error) {
    console.error("❌ Fetch test failed:", error.message);
    console.log("\n💡 Make sure the server is running:");
    console.log("   bun start");
    console.log("   or: bun server.js");
  }
}

// Run the examples
if (import.meta.main) {
  testFetchAPI();
}

export { testFetchAPI };
