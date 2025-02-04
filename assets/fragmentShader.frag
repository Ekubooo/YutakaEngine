#version 330 core 
in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoord;

struct Material{
   vec3 ambient;
   sampler2D specular;
   sampler2D diffuse;
   float shininess;
};

struct LDirection {
   vec3 pos;
   vec3 color;
   vec3 dir2Light;
};
struct LPoint {
   vec3 pos;
   vec3 color;
   vec3 dir2Light;
   float constant;
   float linear;
   float quadratic;
};
struct LSpot {
   vec3 pos;
   vec3 color;
   vec3 dir2Light;
   float cosPhiInner;
   float cosPhiOuter;
};

uniform Material material;
uniform LSpot ltSpot;
uniform LDirection ltDir;
uniform LPoint lightP0;
uniform LPoint lightP1;
uniform LPoint lightP2;
uniform LPoint lightP3;


uniform vec3 objColor;
uniform vec3 ambientColor;
uniform vec3 cameraPos;

out vec4 FragColor;

vec3 CalcDirLight(LDirection light, vec3 uNormal, vec3 dir2Camera)
{
   // diffuse: max(dot(L,N))
   float diffIntensity = max(dot(light.dir2Light, uNormal), 0);
   vec3 diffColor = diffIntensity * light.color * texture(material.diffuse, TexCoord).rgb;
   
   // specular pow(max(dot(R,Nam),0), shininess)
   vec3 R = normalize(reflect(-light.dir2Light,uNormal));
   float specIntensity = pow(max(dot(R, dir2Camera), 0), material.shininess);
   vec3 specColor = specIntensity * light.color * texture(material.specular, TexCoord).rgb;

   // ambient 
   vec3 ambient = texture(material.diffuse, TexCoord).rgb  * ambientColor;

   vec3 result = diffColor  + specColor * 0.0625 + ambient * 0.125;
   return result;
}

vec3 CalcLightPoint(LPoint light, vec3 uNormal, vec3 dir2Camera)
{
   // attenuation
   float dist = length(light.pos - FragPos);
   float attenuation = 
      1.0/(light.constant + light.linear * dist + light.quadratic *(dist * dist));

   // diffuse
   float diffIntensity = 
      max(dot(normalize(light.pos - FragPos), uNormal), 0) * attenuation;
   vec3 diffColor = 
      diffIntensity * light.color * texture(material.diffuse, TexCoord).rgb;
   // specular
   vec3 R = normalize(reflect(-normalize(light.pos - FragPos), uNormal));
   float specIntensity = 
      pow(max(dot(R, dir2Camera), 0), material.shininess) *attenuation;
   vec3 specColor = 
      specIntensity * light.color * texture(material.specular, TexCoord).rgb;

   // ambient 
   vec3 ambient = texture(material.diffuse, TexCoord).rgb  * ambientColor * attenuation;

   vec3 result = diffColor + specColor;
   return result;
}

vec3 CalcLightSpot(LSpot light, vec3 uNormal, vec3 dir2Camera)
{
   // spotRatio
   float cosTheta = dot(normalize(FragPos - light.pos), -1 * light.dir2Light);
   float spotRatio ;
   if(cosTheta > light.cosPhiInner)
   {  // inside
      spotRatio = 1.0f;
   }
   else if(cosTheta > light.cosPhiOuter)
   {  // middle 衰减公式*
      spotRatio = 1.0f - (cosTheta - light.cosPhiInner) /
          (light.cosPhiOuter - light.cosPhiInner);
   } 
   else  // outside
      spotRatio = 0;
   
   // attenuation
   // diffuse
   float diffIntensity = 
      max(dot(normalize(light.pos - FragPos), uNormal), 0) ;
   vec3 diffColor = 
      diffIntensity * light.color * texture(material.diffuse, TexCoord).rgb;

   // specular
   vec3 R = normalize(reflect(-normalize(light.pos - FragPos), uNormal));
   float specIntensity = 
      pow(max(dot(R, dir2Camera), 0), material.shininess);
   vec3 specColor = 
      specIntensity * light.color * texture(material.specular, TexCoord).rgb;

   // ambient 
   vec3 ambient = 
      texture(material.diffuse, TexCoord).rgb  * ambientColor;

   vec3 result = (diffColor + specColor * 0.25) * spotRatio + ambient * 0.5;
   return result;
}

void main()
{
   vec3 finalResult = vec3(0,0,0);
   vec3 uNormal = normalize(Normal);
   vec3 dir2Camera = normalize(cameraPos - FragPos);

   finalResult += CalcDirLight(ltDir,uNormal,dir2Camera);
   //finalResult += CalcLightPoint(lightP0, uNormal, dir2Camera);
   //finalResult += CalcLightPoint(lightP1, uNormal, dir2Camera);
   //finalResult += CalcLightPoint(lightP2, uNormal, dir2Camera);
   //finalResult += CalcLightPoint(lightP3, uNormal, dir2Camera); 
   finalResult += CalcLightSpot(ltSpot, uNormal, dir2Camera); 
   FragColor = vec4(finalResult, 1.0);
   //FragColor = vec4(vec3(gl_FragCoord.z), 1.0); // depth buffer test
   //FragColor = vec4(1.0f,1.0f,1.0f,1.0f);     // Test debug step1
}
