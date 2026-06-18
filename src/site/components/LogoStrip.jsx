import './LogoStrip.css';

const LOGOS = [
  { src: '/logo-kamdhenu-patcorn.png', alt: 'Kamdhenu Patcorn' },
  { src: '/logo-jagwani.png',          alt: 'Jagwani'          },
  { src: '/logo-rma.png',              alt: 'Rahul Mishra & Associates' },
  { src: '/logo-rbp.png',              alt: 'RBP'              },
  { src: '/logo-rigga.png',            alt: 'Rigga'            },
  { src: '/logo-sagar-tmt.png',        alt: 'Sagar TMT & Pipes' },
  { src: '/logo-shyam-group.png',      alt: 'Shyam Group'      },
  { src: '/logo-vaswani.png',          alt: 'Vaswani'          },
  { src: '/logo-zoff.png',             alt: 'Zoff'             },
  { src: '/logo-panorama.png',         alt: 'Panorama'         },
  { src: '/logo-parekh-sanitary.png',  alt: 'Parekh Sanitary'  },
  { src: '/logo-passary.png',          alt: 'Passary'          },
  { src: '/logo-piramal-petroleum.png',alt: 'Piramal Petroleum'},
  { src: '/logo-rama.png',             alt: 'Rama'             },
  { src: '/logo-sankalp.png',          alt: 'Sankalp'          },
  { src: '/logo-sansa.png',            alt: 'Sansa'            },
  { src: '/logo-sarthak-tmt.png',      alt: 'Sarthak TMT'      },
  { src: '/logo-sbh.png',              alt: 'SBH'              },
  { src: '/logo-krishna.png',          alt: 'Krishna'          },
  { src: '/logo-mad-bakers.png',       alt: 'Mad Bakers'       },
  { src: '/logo-mahamaya.png',          alt: 'Mahamaya'         },
  { src: '/logo-pahlajanis.png',       alt: 'Pahlajanis'       },
  { src: '/logo-jainx.png',            alt: 'Jainx'            },
  { src: '/logo-jjspl.png',            alt: 'JJSPL'            },
  { src: '/logo-elem.png',             alt: 'Elem'             },
  { src: '/logo-divine-empire.png',    alt: 'Divine Empire'    },
  { src: '/logo-chandhok.png',         alt: 'Chandhok'         },
  { src: '/logo-ace.png',              alt: 'Ace'              },
  { src: '/logo-affinique.png',        alt: 'Affinique'        },
];

// Duplicate for seamless infinite loop
const TRACK = [...LOGOS, ...LOGOS];

export default function LogoStrip() {
  return (
    <section className="logo-strip" aria-label="Trusted by leading businesses">
      <div className="logo-strip-mask">
        <div className="logo-strip-track">
          {TRACK.map((logo, i) => (
            <div className="logo-strip-item" key={i}>
              <img
                src={logo.src}
                alt={logo.alt}
                loading="lazy"
                draggable="false"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
